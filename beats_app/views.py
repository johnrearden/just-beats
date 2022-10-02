from django.shortcuts import render, get_object_or_404
from django.views import View
from .models import Drumloop, Track, Instrument

class LoopEditor(View):
    def get(self, request, name='default_name', *args, **kwargs):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, name='brand_new_loop')
        tracks = Track.objects.select_related()
        print(tracks)
        
        instruments= Instrument.objects.select_related()

        beats_list = [track.beats for track in tracks]
        beat_volumes_list = [track.beat_volumes for track in tracks]
        instruments_list = [(instrument.name, instrument.url) for instrument in instruments]

        my_dict = {
            'beats': beats_list,
            'beats_volumes': beat_volumes_list, 
            'instruments': instruments_list,
        }

        return render(
            request,
            "loop_editor.html",
            {
                "loop": loop,
                "yoke": my_dict,
                "tracks": tracks,
            }
        )
