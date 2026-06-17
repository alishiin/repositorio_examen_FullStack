from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('room_name', 'sender', 'content', 'timestamp')
    list_filter = ('room_name', 'timestamp')
    search_fields = ('room_name', 'sender', 'content')
    readonly_fields = ('timestamp',)
    list_per_page = 50
    ordering = ('-timestamp',)
