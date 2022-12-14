from django.contrib import admin
from .models import Drumloop, Track, Instrument, Review


@admin.register(Drumloop)
class DrumloopAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'creator', 'slug', 'created_on', 'tempo',
                    'rating')
    list_editable = ('name', 'creator', 'slug', 'tempo', 'rating')
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


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'reviewer', 'drumloop', 'approved', 'rating',
                    'comment', 'created_on',)
    list_editable = ('reviewer', 'drumloop', 'rating', 'comment', 'approved',)
