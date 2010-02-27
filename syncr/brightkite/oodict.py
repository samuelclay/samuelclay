"""
OODict: object view of dict
Copyright (C) 2008 Chen Zheng <nkchenz@gmail.com>
Distributed under terms of GPL v2
"""

class OODict(dict):
    """
    OODict
        OO style dict

    Examples:
    >>> a = OODict({'a': 1, 'c': {'d': 2}, 'b': 2})
    >>> a
    {'a': 1, 'c': {'d': 2}, 'b': 2}
    >>> a.a=0
    >>> a
    {'a': 0, 'c': {'d': 2}, 'b': 2}
    >>> a.e=0
    >>> a
    {'a': 0, 'c': {'d': 2}, 'b': 2, 'e': 0}
    >>> a.c = 5
    >>> a
    {'a': 0, 'c': 5, 'b': 2, 'e': 0}
    >>> a.f = OODict({'f':'f'}) 
    >>> a
    {'a': 0, 'c': 5, 'b': 2, 'e': 0, 'f': {'f': 'f'}}
    >>> a.f.f
    'f'
    >>> a.c = {'d': 2}
    >>> a
    {'a': 0, 'c': {'d': 2}, 'b': 2, 'e': 0, 'f': {'f': 'f'}}
    >>> a.c
    {'d': 2}
    >>> a.c.d
    2
    >>> a.c.e = {'e': 'e'}
    >>> a
    {'a': 0, 'c': {'e': {'e': 'e'}, 'd': 2}, 'b': 2, 'e': 0, 'f': {'f': 'f'}}
    >>> a.c.e.e
    'e'

    """
    def __init__(self, data = {}):
        dict.__init__(self, data)

    def __getattr__(self, key):
        value = self[key]
        if isinstance(value, dict) and not isinstance(value, OODict):
            value = OODict(value)
            self[key] = value
        return value

    def __setattr__(self, key, value):
        self[key] = value


if __name__ == "__main__":
    import doctest
    doctest.testmod()

