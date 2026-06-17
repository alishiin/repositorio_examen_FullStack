from django.contrib import admin

from .models import MatchResult, PetAnalysis


@admin.register(PetAnalysis)
class PetAnalysisAdmin(admin.ModelAdmin):
    list_display = ('report_id', 'pet_type', 'created_at')
    list_filter = ('pet_type', 'created_at')
    search_fields = ('report_id', 'ai_description')
    readonly_fields = ('created_at',)
    list_per_page = 30
    ordering = ('-created_at',)


@admin.register(MatchResult)
class MatchResultAdmin(admin.ModelAdmin):
    list_display = (
        'lost_report_id',
        'found_report_id',
        'score',
        'is_confirmed',
        'created_at',
    )
    list_filter = ('is_confirmed', 'created_at')
    list_editable = ('is_confirmed',)
    search_fields = ('lost_report_id', 'found_report_id')
    readonly_fields = ('created_at', 'score', 'reasons')
    list_per_page = 30
    ordering = ('-score', '-created_at')
