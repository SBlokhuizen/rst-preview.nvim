Test Document
=============

This is a test of **rst-preview.nvim**. The browser should update live
as you edit this file.

Section One
-----------

Here is a paragraph with some *italic* and **bold** text,
as well as a ``code snippet`` inline.

.. note::

   This is a note admonition. It should appear with a blue left border.

.. warning::

   This is a warning admonition.

.. tip::

   This is a tip admonition.

Code Block
----------

.. code-block:: python

   def hello(name):
       """Say hello."""
       return f"Hello, {name}!"

   print(hello("world"))

A Literal Block::

   This is a literal block.
   Indented text becomes preformatted.

Lists
-----

Unordered:

- Item one
- Item two

  - Nested item
  - Another nested item

- Item three

Ordered:

1. First
2. Second
3. Third

Definition List
---------------

term
    The definition of the term.

another term
    Another definition here.

Table
-----

=====  =====  =======
A      B      A and B
=====  =====  =======
False  False  False
True   False  False
False  True   False
True   True   True
=====  =====  =======

Links
-----

Visit `Python <https://python.org>`_ for more information.

This is a reference to `Section One`_.

Footnotes
---------

Here is a footnote reference [1]_.

.. [1] This is the footnote text.
