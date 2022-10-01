from django.shortcuts import render, get_object_or_404
from django.views import View
from .models import Drumloop, Track, Instrument

class LoopEditor(View):
    def get(self, request, name='default_name', *args, **kwargs):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, name='default_name')
        track = Track.objects.select_related()[:1]
        instrument = Instrument.objects.select_related()[0]
        print(f"Instrument: {instrument}")
        print(loop.created_on)
        print(f"Tracks in {loop} : {track}")

        return render(
            request,
            "loop_editor.html",
            {
                "loop": loop,
                "tracks": track, 
                "instrument": instrument,
            }
        )
