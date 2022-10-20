from math import log, floor


def human_format(number):
    units = ["", " Thousand", " Million", " Billion", " Trillion", " Quatrillion"]
    k = 1000.0
    magnitude = int(floor(log(number, k)))
    return "%.2f%s" % (number / k**magnitude, units[magnitude])
