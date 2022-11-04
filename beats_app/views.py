from django.http import HttpResponseRedirect, HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import render, get_object_or_404, redirect
from django.urls import reverse
from django.views import View, generic
from django.contrib.auth.models import User
from urllib.parse import urlencode
from .models import Drumloop, Track, Instrument
from .serializers import TrackSerializer

import json


class LoopList(generic.ListView):
    model = Drumloop
    queryset = Drumloop.objects.order_by('-rating')
    template_name = 'loop_list.html'
    paginate_by = 3


class LoopEditor(View):
    def get(self, request, id=1, *args, **kwargs):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, id=id)
        tracks = Track.objects.select_related().filter(drumloop=loop)
        instruments = Instrument.objects.order_by('name')

        return render(
            request,
            "loop_editor.html",
            {
                "loop": loop,
                "tracks": tracks,
                "instruments": instruments,
            }
        )

    def post(self, request, id):

        querydict = request.POST
        track_ids = querydict.getlist('tracks')
        for count, id_str in enumerate(track_ids):
            id = int(id_str)
            queryset = Track.objects.filter(id=id)
            beats = querydict.get(f"beats_{id}")
            track_volume = querydict.get(f"track_volume_{id}")
            track = queryset.first()
            track.beats = beats
            track.track_volume = track_volume
            instrument_id = int(querydict.getlist("instrument_id")[count])
            track.instrument = Instrument.objects.get(id=instrument_id)
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

        keep_editing = querydict.get('keep_editing') == 'yes'
        if keep_editing:
            return HttpResponseRedirect(f"/editor/{loop_id}")
        else:
            return HttpResponseRedirect(reverse('home'))

class SaveLoopAndTracks(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        print(f'data is {data}')
        loopID = int(data.get('loopID'))
        original_loop = Drumloop.objects.get(pk=loopID)
        original_loop.name = data.get('name')
        original_loop.tempo = int(data.get('tempo'))
        original_loop.save()
        for element in data.get('trackList'):
            trackID = int(element.get('trackID'))
            original_track = Track.objects.get(pk=trackID)
            original_track.beats = element.get('beats')
            original_track.track_volume = element.get('volume')
            instrument = Instrument.objects.get(pk=element.get('instrumentID'))
            original_track.instrument = instrument
            original_track.save()
            print(f'track {trackID} saved')
        print(f'drumloop {loopID} saved!')
        return Response('Ok')




class TracksForLoop(APIView):
    def get(self, request, id, *args, **kwargs):
        try:
            loop = Drumloop.objects.get(id=id)
        except Drumloop.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        tracks = Track.objects.select_related().filter(drumloop=loop)
        serializer = TrackSerializer(tracks, context={'request': request}, many=True)
        return Response(serializer.data)

class AddNewTrack(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        loopID = int(data.get('loopID'))
        instrumentID = int(data.get('instrumentID'))
        drumloop = Drumloop.objects.get(pk=loopID)
        instrument = Instrument.objects.get(pk=instrumentID)
        newTrack = Track(drumloop=drumloop,instrument=instrument)
        newTrack.save()
        return HttpResponse('Ok')

class DeleteTrack(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        trackID = int(data.get('trackID'))
        Track.objects.get(pk=trackID).delete()
        return HttpResponse('Ok')
