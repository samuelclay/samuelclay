from django.contrib import admin
from models import Book

class BookAdmin(admin.ModelAdmin):
    search_fields = ['title', 'author',]
    list_display = ('created', 'title')
    
admin.site.register(Book, BookAdmin)