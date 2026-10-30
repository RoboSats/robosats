package com.robosats.tor

import android.app.Application
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Toast
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import io.matthewnelson.kmp.tor.resource.exec.tor.ResourceLoaderTorExec
import io.matthewnelson.kmp.tor.runtime.Action
import io.matthewnelson.kmp.tor.runtime.RuntimeEvent
import io.matthewnelson.kmp.tor.runtime.RuntimeEvent.EXECUTE.CMD.observeSignalNewNym
import io.matthewnelson.kmp.tor.runtime.TorListeners
import io.matthewnelson.kmp.tor.runtime.TorRuntime
import io.matthewnelson.kmp.tor.runtime.core.OnEvent
import io.matthewnelson.kmp.tor.runtime.core.OnFailure
import io.matthewnelson.kmp.tor.runtime.core.OnSuccess
import io.matthewnelson.kmp.tor.runtime.core.TorEvent
import io.matthewnelson.kmp.tor.runtime.core.config.IntervalUnit
import io.matthewnelson.kmp.tor.runtime.core.config.TorOption
import io.matthewnelson.kmp.tor.runtime.core.ctrl.TorCmd
import io.matthewnelson.kmp.tor.runtime.core.net.Port.Ephemeral.Companion.toPortEphemeral
import java.io.File
import java.net.InetSocketAddress
import java.net.Proxy

// kmp-tor 2.x (tor 0.4.9). Since 28 Oct 2026 the consensus requires
// Desc=3/Microdesc=3 and tor 0.4.8 (kmp-tor 1.x) stalls at ~30% bootstrap.
class TorKmp(private val application : Application) {

    private val TAG = "TorListener"

    // SocksPort handed to OkHttp; 9264 is onion-only and must never be it
    private val mainSocksPort = 9254
    private val onionOnlySocksPort = 9264

    private val listener = TorListener()

    val events: LiveData<String> get() = listener.eventLines

    private val environment: TorRuntime.Environment by lazy {
        // tor runs in its own process (exec), extracted from nativeLibraryDir;
        // needs jniLibs.useLegacyPackaging = true
        TorRuntime.Environment.Builder(
            workDirectory = application.getDir("kmptor", Context.MODE_PRIVATE),
            cacheDirectory = File(application.cacheDir, "kmptor"),
            loader = ResourceLoaderTorExec::getOrCreate,
        ) {
            // Callbacks only post LiveData / log, so no need for the main thread
            defaultEventExecutor = OnEvent.Executor.Immediate
        }
    }

    private val runtime: TorRuntime by lazy {
        TorRuntime.Builder(environment) {
            observerStatic(RuntimeEvent.STATE) { listener.onState(it) }
            observerStatic(RuntimeEvent.LISTENERS) { listener.onListeners(it) }
            observerStatic(RuntimeEvent.ERROR) { t ->
                Log.e(TAG, "kmp-tor error", t)
                listener.addLine("ERROR - $t")
            }
            observerStatic(RuntimeEvent.LOG.INFO) { listener.addLine("$it") }
            observerStatic(RuntimeEvent.LOG.WARN) { listener.addLine("$it") }
            observerStatic(TorEvent.WARN) { listener.addLine("WARN - $it") }
            observerStatic(TorEvent.ERR) { listener.addLine("ERR - $it") }

            config { _ ->
                // Set multiple ports for all of the things. If a port is taken,
                // kmp-tor reassigns it to "auto" instead of failing startup.
                TorOption.__DNSPort.configure { port(9252.toPortEphemeral()) }
                TorOption.__DNSPort.configure { port(9253.toPortEphemeral()) }

                TorOption.__SocksPort.configure { port(mainSocksPort.toPortEphemeral()) }
                TorOption.__SocksPort.configure { port(9255.toPortEphemeral()) }

                TorOption.__HTTPTunnelPort.configure { port(9258.toPortEphemeral()) }
                TorOption.__HTTPTunnelPort.configure { port(9259.toPortEphemeral()) }

                TorOption.__TransPort.tryConfigure { port(9262.toPortEphemeral()) }
                TorOption.__TransPort.tryConfigure { port(9263.toPortEphemeral()) }

                // Isolated SocksPort for onion traffic only
                TorOption.__SocksPort.configure {
                    port(onionOnlySocksPort.toPortEphemeral())
                    flagsSocks { OnionTrafficOnly = true }
                    flagsIsolation { IsolateClientAddr = true }
                }

                // For Android, disabling & reducing connection padding is
                // advisable to minimize mobile data usage.
                TorOption.ConnectionPadding.configure { disable() }
                TorOption.ReducedConnectionPadding.configure(true)

                // Tor default is 24h. Reducing to 10 min helps mitigate
                // unnecessary mobile data usage.
                TorOption.DormantClientTimeout.configure(10, IntervalUnit.MINUTES)

                // Tor defaults this setting to false which would mean if
                // Tor goes dormant, the next time it is started it will still
                // be in the dormant state and will not bootstrap until being
                // set to "active". This ensures that if it is a fresh start,
                // dormancy will be cancelled automatically.
                TorOption.DormantCanceledByStartup.configure(true)
            }

            required(TorEvent.WARN)
            required(TorEvent.ERR)
        }.also { rt ->
            rt.observeSignalNewNym(TAG, null) { rateLimited ->
                val msg = rateLimited ?: NEW_NYM_SUCCESS
                listener.addLine(msg)
                toast(msg)
            }
        }
    }

    var torState: TorState = TorState()
        get() = field

    val torStateLiveData: MutableLiveData<TorState> = MutableLiveData()
        get() = field

    @Volatile
    var proxy: Proxy? = null
        get() = field

    fun isConnected(): Boolean {
        val daemon = runtime.state().daemon
        return daemon.isOn && daemon.isBootstrapped
    }

    fun isStarting(): Boolean {
        val daemon = runtime.state().daemon
        return daemon.isStarting || (daemon.isOn && !daemon.isBootstrapped)
    }

    fun startQuietly() {
        runtime.enqueue(Action.StartDaemon, onFailure("start"), OnSuccess.noOp())
    }

    fun stopQuietly() {
        runtime.enqueue(Action.StopDaemon, onFailure("stop"), OnSuccess.noOp())
    }

    fun restartQuietly() {
        runtime.enqueue(Action.RestartDaemon, onFailure("restart"), OnSuccess.noOp())
    }

    fun newIdentity() {
        // Success (or rate limiting) is reported by the observeSignalNewNym observer
        runtime.enqueue(
            TorCmd.Signal.NewNym,
            OnFailure {
                val msg = "Tor identity change failed"
                listener.addLine(msg)
                toast(msg)
            },
            OnSuccess.noOp(),
        )
    }

    private fun onFailure(action: String): OnFailure = OnFailure { t ->
        Log.w(TAG, "Tor $action failed: ${t.message}")
        listener.addLine("Tor $action failed: ${t.message}")
    }

    private fun toast(msg: String) {
        Handler(Looper.getMainLooper()).post {
            Toast.makeText(application, msg, Toast.LENGTH_SHORT).show()
        }
    }

    private inner class TorListener {
        private val _eventLines: MutableLiveData<String> = MutableLiveData("")
        val eventLines: LiveData<String> = _eventLines
        private val events: MutableList<String> = ArrayList(50)
        fun addLine(line: String) {
            synchronized(this) {
                if (events.size > 49) {
                    events.removeAt(0)
                }
                events.add(line)
                _eventLines.postValue(events.joinToString("\n"))
            }
        }

        fun onState(state: io.matthewnelson.kmp.tor.runtime.TorState) {
            val daemon = state.daemon
            val bootstrap = daemon.bootstrap.toInt()
            val enumState = when {
                daemon.isOn && daemon.isBootstrapped -> EnumTorState.ON
                daemon.isOn || daemon.isStarting -> EnumTorState.STARTING
                daemon.isStopping -> EnumTorState.STOPPING
                else -> EnumTorState.OFF
            }

            torState.progressIndicator = bootstrap
            torState.state = enumState
            val liveTorState = TorState()
            liveTorState.progressIndicator = bootstrap
            liveTorState.state = enumState
            torStateLiveData.postValue(liveTorState)

            Log.i(TAG, "Tor state: $enumState bootstrap=$bootstrap% ($state)")
            addLine(state.toString())
        }

        fun onListeners(listeners: TorListeners) {
            // Prefer the main SocksPort; never the onion-only one, clearnet
            // requests (e.g. Nostr relays) would fail through it
            val socks = listeners.socks.firstOrNull { it.port.value == mainSocksPort }
                ?: listeners.socks.firstOrNull { it.port.value != onionOnlySocksPort }

            proxy = if (socks == null) {
                // Tor stopped or network disabled: listeners closed
                null
            } else {
                Proxy(Proxy.Type.SOCKS, InetSocketAddress(socks.address.value, socks.port.value))
            }
            Log.i(TAG, "Tor SOCKS proxy: ${socks ?: "none"}")
            addLine(listeners.toString())
        }
    }

    companion object {
        private const val NEW_NYM_SUCCESS = "You've changed Tor identities!"
    }
}

object TorKmpManager {
    private lateinit var torKmp: TorKmp

    @Throws(UninitializedPropertyAccessException::class)
    fun getTorKmpObject(): TorKmp {
        return torKmp
    }

    fun updateTorKmpObject(newKmpObject: TorKmp) {
        torKmp = newKmpObject
    }
}
