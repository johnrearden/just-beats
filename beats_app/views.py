from django.http import HttpResponseRedirect, HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.shortcuts import render, get_object_or_404
from django.views import View, generic
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .models import Drumloop, Track, Instrument, Review
from .serializers import TrackSerializer
from .forms import NewDrumloopForm, ReviewForm


class LoopList(View):
    def get(self, request, selection='all'):
        print(f'selection == {selection}')
        if (selection == 'all'):
            drumloops = Drumloop.objects.order_by('-rating')
        else: 
            drumloops = Drumloop.objects.filter(creator=request.user).order_by('-rating')
        context = {
                'drumloops': drumloops,
                'selection': selection,
        }
        return render(
            request,
            'loop_list.html',
            context
        )


class CreateNewLoop(View):
    def get(self, request):
        return render(
            request,
            'new_drumloop_form.html',
            {"new_drumloop_form": NewDrumloopForm()}
        )

    def post(self, request):
        querydict = request.POST
        creator_id_string = querydict.get('creator')
        creator = User.objects.get(id=int(creator_id_string))
        name = querydict.get('name')
        new_drumloop = Drumloop.objects.create(
            name=querydict.get('name'),
            tempo=int(querydict.get('tempo')),
            creator=creator
            )
        drumloop_id = new_drumloop.pk
        instrument = Instrument.objects.first()
        default_track = Track.objects.create(
            drumloop=new_drumloop,
            instrument=instrument,)
        messages.success(request, f'New loop created by {creator.username}.... it\'s called {name}!')
        return HttpResponseRedirect(f'/editor/{drumloop_id}')


class ReviewDrumloop(View):
    def get(self, request, id, username):
        drumloop = Drumloop.objects.get(id=int(id))
        user = User.objects.get(username=username)
        previous_reviews = Review.objects.filter(
            drumloop=drumloop).order_by('-created_on')[:5]
        review_form = ReviewForm(
            initial={'rating': '3', 'drumloop': drumloop, 'reviewer': user})
        context = {
            "review_form": review_form,
            "user": user,
            "drumloop": drumloop,
            "previous_reviews": previous_reviews,
        }
        return render(request, 'review_form.html', context)


class SaveReview(View):
    def post(self, request):
        form = ReviewForm(request.POST)
        if form.is_valid():
            form.save()

            # Recalculate the average rating for this loop.
            querydict = request.POST
            loop_id = int(querydict.get('drumloop'))
            all_reviews = Review.objects.all().filter(drumloop=loop_id)
            total = sum([review.rating for review in all_reviews])
            average_rating = total / (len(all_reviews))
            drumloop = Drumloop.objects.get(id=loop_id)
            drumloop.rating = average_rating
            print(drumloop)
            drumloop.save()

            messages.success(request, f"Thanks! Your review has been saved and is awaiting approval.")
        else:
            return render(request, 'review_form.html', {'form': form})
        return HttpResponseRedirect('/')


class LoopEditor(View):
    def get(self, request, id=1, *args, **kwargs):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, id=id)
        if loop.creator != request.user:
            return HttpResponse('No way Jose')
        else:
            tracks = Track.objects.select_related().filter(drumloop=loop).order_by('id')
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


class SaveLoopAndTracks(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
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

        return Response('Ok')


class TracksForLoop(APIView):
    def get(self, request, id, *args, **kwargs):
        loop = Drumloop.objects.get(id=id)
        tracks = Track.objects.select_related().filter(drumloop=loop).order_by('id')
        serializer = TrackSerializer(
            tracks, context={'request': request}, many=True)
        return Response(serializer.data)


class AddNewTrack(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        loopID = int(data.get('loopID'))
        instrumentID = int(data.get('instrumentID'))
        drumloop = Drumloop.objects.get(pk=loopID)
        instrument = Instrument.objects.get(pk=instrumentID)
        newTrack = Track(drumloop=drumloop, instrument=instrument)
        newTrack.save()
        messages.success(request, f'New track added, with the instrument {instrument.name}')
        return HttpResponse('Ok')


class DeleteTrack(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        trackID = int(data.get('trackID'))
        Track.objects.get(pk=trackID).delete()
        return HttpResponse('Ok')
