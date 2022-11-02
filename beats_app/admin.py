from django.contrib import admin
from .models import Drumloop, Track, Instrument

@admin.register(Drumloop)
class DrumloopAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'creator', 'created_on', 'tempo', 'rating')
    list_editable = ('name', 'creator', 'tempo', 'rating')
    search_fields = ('name',)

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('id', 'drumloop', 'beats', 'track_volume', 'instrument')

    def get_instrument(self, instance):
        return [instrument.name for instrument in instance.instrument.all()]

@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'url')
    list_editable = ('name', 'url')
