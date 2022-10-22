from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.views import View, generic
from django.contrib.auth.models import User
from .models import Drumloop, Track, Instrument


class LoopList(generic.ListView):
    model = Drumloop
    queryset = Drumloop.objects.order_by('-created_on')
    template_name = 'loop_list.html'
    paginate_by = 3


class LoopEditor(View):
    def get(self, request, id=1, *args, **kwargs):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, id=id)
        tracks = Track.objects.select_related().filter(drumloop=loop)

        return render(
            request,
            "loop_editor.html",
            {
                "loop": loop,
                "tracks": tracks,
            }
        )

    def post(self, request):

        print(request.POST)
        querydict = request.POST
        track_ids = querydict.getlist('tracks')
        for id_str in track_ids:
            id = int(id_str)
            queryset = Track.objects.filter(id=id)
            beats = querydict.get(f"beats_{id}")
            beat_volumes = querydict.get(f"beat_volumes_{id}")
            track_volume = querydict.get(f"track_volume_{id}")
            track = queryset.first()
            track.beats = beats
            track.beat_volumes = beat_volumes
            track.track_volume = track_volume
            track.save()
        loop_id = int(querydict.get('drumloop_id'))
        drumloop = Drumloop.objects.filter(id=loop_id).first()
        drumloop.name = querydict.get('drumloop_name')
        user_name = querydict.get('creator_name')
        user = User.objects.all().filter(username=user_name)[0]
        drumloop.creator = user
        drumloop.tempo = int(querydict.get('tempo'))
        if querydict.__contains__('allow_copy'):
            drumloop.allow_copy = True
        else:
            drumloop.allow_copy = False
        drumloop.save()

        return HttpResponseRedirect(reverse('home'))
