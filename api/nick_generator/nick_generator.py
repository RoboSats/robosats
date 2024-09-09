import hashlib

# UNUSED
# import time

# UNUSED
# from .utils import human_format


class NickGenerator:
    """
    Deterministic nick generator from SHA256 hash.

    It builds Nicknames as:
    Adverb + Adjective + Noun + Numeric(0-999)

    With the current English dictionaries there
    is a total of to 450*4800*12500*1000 =
    28 Trillion deterministic nicks"""

    def __init__(
        self,
        lang="English",
        use_adv=True,
        use_adj=True,
        use_noun=True,
        max_num=999,
        verbose=False,
    ):
        """
        used_adv: bool , True if adverbs are used in the nick.
        used_adj: bool , True if adjectives are used in the nick.
        use_noun: bool , True if nouns are used in the nick.
        max_num: int, max integer to be used in nick (at least 1)
        """
        if lang == "English":
            from .dicts.en.adjectives import adjectives
            from .dicts.en.adverbs import adverbs
            from .dicts.en.nouns import nouns

        # UNUSED
        # elif lang == "Spanish":
        #     from .dicts.es.adjectives import adjectives
        #     from .dicts.es.adverbs import adverbs
        #     from .dicts.es.nouns import nouns
        # else:
        #     raise ValueError("Language not implemented.")
        # UNUSED
        # if verbose:
        #     print(
        #         f"{lang} SHA256 Nick Generator initialized with:"
        #         + f"\nUp to {len(adverbs)} adverbs."
        #         + f"\nUp to {len(adjectives)} adjectives."
        #         + f"\nUp to {len(nouns)} nouns."
        #         + f"\nUp to {max_num+1} numerics.\n"
        #     )

        self.use_adv = use_adv
        self.use_adj = use_adj
        self.use_noun = use_noun
        self.max_num = max_num
        self.verbose = verbose
        self.adverbs = adverbs
        self.adjectives = adjectives
        self.nouns = nouns

    def from_SHA256(self, hash=None):
        """
        Converts hash to int, min-max scales it
        to the pool size of nicks, uses it as
        index to construct the nick element by
        element.

        hash; SHA256 hash as bytes
        """

        # Get size of dictionaries for each element
        num_adv = len(self.adverbs) if self.use_adv else 1
        num_adj = len(self.adjectives) if self.use_adj else 1
        num_nouns = len(self.nouns) if self.use_noun else 1

        # Compute pool size by combinatorics
        pool_size = self.max_num * num_nouns * num_adj * num_adv

        # Min-Max scale the hash relative to the pool size
        max_int_hash = 2**256
        int_hash = int(hash, 16)
        nick_id = int((int_hash / max_int_hash) * pool_size)

        # Compute adverb id
        if self.use_adv:
            pass
            # UNUSED
            # adv_id = int(nick_id / (self.max_num * num_nouns * num_adj))
            # adv = self.adverbs[adv_id]
            # remainder = nick_id - adv_id * self.max_num * num_nouns * num_adj
            # if self.verbose:
            #     print(f"Adverb: {adv}, id {adv_id}.")
        else:
            adv, remainder = "", nick_id

        # Compute adjective id
        if self.use_adj:
            adj_id = int(remainder / (self.max_num * num_nouns))
            adj = self.adjectives[adj_id]
            remainder = remainder - adj_id * self.max_num * num_nouns
            if self.verbose:
                print(f"Adjective: {adj}, id {adj_id}.")
        else:
            adj_id, adj = 0, ""

        # Compute noun id
        if self.use_noun:
            noun_id = int(remainder / self.max_num)
            noun = self.nouns[noun_id]
            if self.verbose:
                print(f"Noun: {noun}, id {noun_id}.\n")
        else:
            noun_id, noun = 0, ""

        # Remainder is the numeric element
        if self.max_num > 0:
            num_id = remainder - noun_id * self.max_num
            number = str(num_id)
        else:
            num_id, number = 0, ""

        # Build nick
        nick = adv + adj + noun + number

        return nick, nick_id, pool_size

    def short_from_SHA256(
        self,
        primer_hash=None,
        max_length=25,
        max_iter=10_000,
    ):
        """
        Generates Nicks that are short.

        Iterates trough hashes deterministically
        until it finds a nick that satisfies
        the lenght restriction.
        """
        hash = primer_hash
        i = 0
        while i < max_iter:
            nick, nick_id, pool_size = self.from_SHA256(hash)
            if len(nick) <= max_length:
                return nick, nick_id, pool_size, i
            else:
                string = str(hash) + str(42)
                hash = hashlib.sha256(str.encode(string)).hexdigest()
                i = i + 1
        return "", 0, 0, i

    def compute_pool_size_loss(self, max_length=22, max_iter=1_000_000, num_runs=5000):
        """
        Computes median an average loss of
        nick pool diversity due to max_lenght
        restrictions.
        """
        return
        # UNUSED
        # import random
        # import statistics

        # attempts = []
        # for i in range(num_runs):
        #     string = str(random.uniform(0, 1_000_000))
        #     hash = hashlib.sha256(str.encode(string)).hexdigest()

        #     _, _, pool_size, tries = self.short_from_SHA256(hash, max_length)
        #     attempts.append(tries)

        # median = statistics.median(attempts)
        # mean = statistics.mean(attempts)

        # print(f"\nFor max_length of {max_length}:")
        # print(f"Median loss of entropy factor is {median}.")
        # print(f"Mean loss of entropy factor is {mean}.")
        # print(
        #     f"Approximate real pool is {human_format( int(pool_size/(mean+1)))} nicks in size."
        # )


# UNUSED
# if __name__ == "__main__":
#     # Just for code timming
#     t0 = time.time()

#     # Hardcoded example text and hashing
#     nick_lang = "English"  # Spanish
#     hash = hashlib.sha256(b"No one expected such cool nick!!").hexdigest()
#     max_length = 22
#     max_iter = 100_000_000

#     # Initialized nick generator
#     GenNick = NickGenerator(lang=nick_lang)

#     # Generates a short nick with length limit from SHA256
#     nick, nick_id, pool_size, iterations = GenNick.short_from_SHA256(
#         hash, max_length, max_iter
#     )

#     # Output
#     print(
#         f"Nick number {nick_id} has been selected among"
#         + f" {human_format(pool_size)} possible nicks.\n"
#         + f"Needed {iterations} iterations to find one "
#         + f"this short.\nYour nick is {nick} !\n"
#     )
#     print(f"Nick lenght is {len(nick)} characters.")
#     print(f"Nick landed at height {nick_id/(pool_size+1)} on the pool.")
#     print(f"Took {time.time()-t0} secs.\n")

#     # Print many nicks
#     import random

#     random.seed(1)

#     for i in range(100):
#         string = str(random.uniform(0, 1_000_000))
#         hash = hashlib.sha256(str.encode(string)).hexdigest()
#         print(
#             GenNick.short_from_SHA256(hash, max_length=max_length, max_iter=max_iter)[0]
#         )

#     # Other analysis
#     GenNick.compute_pool_size_loss(max_length, max_iter, 200)
