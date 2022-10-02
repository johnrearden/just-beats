from django.contrib import admin
from .models import Drumloop, Track, Instrument

@admin.register(Drumloop)
class DrumloopAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_on', 'allow_copy', 'tempo')
    search_fields = ('name',)

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('id', 'drumloop', 'beats','beat_volumes', 'track_volume', 'instrument')

    def get_instrument(self, instance):
        return [instrument.name for instrument in instance.instrument.all()]

@admin.register(Instrument)
class InstrumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'url')
