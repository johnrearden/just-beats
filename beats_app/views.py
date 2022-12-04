from django.http import HttpResponseRedirect, HttpResponse
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import render, get_object_or_404
from django.views import View
from django.contrib import messages
from django.contrib.auth.models import User
from .models import Drumloop, Track, Instrument, Review
from .serializers import TrackSerializer
from .forms import NewDrumloopForm, ReviewForm


class LoopList(View):
    """
    This view returns a list view of the drumloops stored in the database. The
    view takes an optional parameter 'selection', which defaults to 'all'. If
    this parameter is set to anything other than all, the view returns a list
    of only the drumloops created by the current user.
    """

    def get(self, request, selection='all'):
        if (selection == 'all'):
            drumloops = Drumloop.objects.order_by('-rating')
        else:
            drumloops = Drumloop.objects.filter(
                creator=request.user).order_by('-rating')
        context = {
            'drumloops': drumloops,
            'selection': selection,
        }
        return render(
            request,
            'loop_list.html',
            context
        )


class LoopDetail(View):
    """
    This view returns a read-only view of a drumloop, which can be accessed
    by any unauthenticated user.
    """

    def get(self, request, creator, loop_name):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, name=loop_name)
        tracks = (Track.objects.select_related()
                  .filter(drumloop=loop)
                  .order_by('id'))
        recent_reviews = Review.objects.filter(drumloop=loop).order_by(
            '-created_on')[:5]
        context = {
            'loop': loop,
            'tracks': tracks,
            'reviews': recent_reviews,
        }
        return render(
            request, 'loop_detail.html', context
        )


class CreateNewLoop(View):
    """
    This view has 2 methods, get and post.

    The GET method returns a short form that asks the user for a name and
    tempo for the new loop.

    The POST method accepts the submitted form, creates the drumloop and a
    default track. It then redirects the user to the LoopEditor view, and
    creates a message for the user confirming the loop creation.
    """

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
        Track.objects.create(
            drumloop=new_drumloop,
            instrument=instrument,)
        messages.success(
            request, (f'New loop created by {creator.username}.... its called'
                      f'{name}!'))
        return HttpResponseRedirect(f'/editor/{drumloop_id}')


class ReviewDrumloop(View):
    """
    This view returns a page to the user consisting of a review form for the
    loop that is currently playing, and a list of the comments and ratings
    from previous reviews.
    """

    def get(self, request, id, username):
        drumloop = Drumloop.objects.get(id=int(id))
        user = request.user
        previous_reviews = Review.objects.filter(
            drumloop=drumloop).order_by('-created_on')[:5]
        existing_review_by_user = Review.objects.filter(
            drumloop=drumloop, reviewer=user
        )

        # If there is an existing review of this loop by the user, give this
        # review back to them for editing - a user should only be able to
        # review a loop once.
        if len(existing_review_by_user) > 0:
            previous_rating_exists = True
            existing_rating = existing_review_by_user[0].rating
            existing_comment = existing_review_by_user[0].comment
            review_form = ReviewForm(
                initial={
                    'rating': existing_rating,
                    'drumloop': drumloop,
                    'reviewer': user,
                    'comment': existing_comment}
            )
        else:
            previous_rating_exists = False
            review_form = ReviewForm(
                initial={
                    'rating': '3',
                    'drumloop': drumloop,
                    'reviewer': user})
        context = {
            "previous_rating_exists": previous_rating_exists,
            "review_form": review_form,
            "user": user,
            "drumloop": drumloop,
            "previous_reviews": previous_reviews,
        }
        return render(request, 'review_form.html', context)


class SaveReview(View):
    """
    This view's POST method accepts a completed review form and checks it for
    validity. If valid, it checks to ensure that this is a new review of this
    loop by this reviewer. If so, it saves it. Otherwise, it updates the
    existing review. It then calculates the new average rating for the
    drumloop, and saves the new value to the database. Finally, it sends
    the user a message confirming receipt of the review, and redirects
    to the LoopList view.
    """

    def post(self, request):
        form = ReviewForm(request.POST)
        if form.is_valid():
            # Check if this form's reviewer has already reviewed this loop.
            querydict = request.POST
            loop_id = int(querydict.get('drumloop'))
            reviewer = querydict.get('reviewer')
            existing_review_by_user = Review.objects.filter(
                drumloop=loop_id, reviewer=reviewer)

            # If a review already exists, update it. Otherwise, save this one.
            if len(existing_review_by_user) > 0:
                existing_review = existing_review_by_user[0]
                existing_review.rating = int(querydict.get('rating'))
                existing_review.comment = querydict.get('comment')
                existing_review.approved = False
                existing_review.save()
            else:
                form.save()

            # Recalculate the average rating for this loop.
            all_reviews = Review.objects.all().filter(drumloop=loop_id)
            total = sum([review.rating for review in all_reviews])
            average_rating = total / (len(all_reviews))
            drumloop = Drumloop.objects.get(id=loop_id)
            drumloop.rating = average_rating
            drumloop.save()
            messages.success(
                request, ("Thanks! Your review has been saved and is awaiting"
                          " approval."))
        else:
            return render(request, 'review_form.html', {'form': form})
        return HttpResponseRedirect('/')


class LoopEditor(View):
    """
    This view returns a page to the user on which they can edit the drumloop.
    To prevent direct manipulation of the url in the address bar, the editor
    will only be returned if the loop creator matches the currently
    authenticated user.
    """

    def get(self, request, id=1, *args, **kwargs):
        query_set = Drumloop.objects.all()
        loop = get_object_or_404(query_set, id=id)
        if loop.creator != request.user:
            return HttpResponseRedirect('/direct_url_entry_warning')
        else:
            tracks = (Track.objects.select_related()
                      .filter(drumloop=loop)
                      .order_by('id'))
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
    """
    This APIView accepts a post request from the loop_editor.html page, with
    the current loop and track data. It saves this data to the database,
    and then returns a response code to the page. The user message is
    supplied via a script, as the page is not reloaded (this allows the loop
    to continue playing throughout for a better user experience)
    """

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
    """
    This APIView returns a json-encoded list of the tracks for the requested
    loop. It is called by both the loop_editor and loop_list pages, through
    the LoopPlayer JavaScript object common to both. It is written as an
    API view as the LoopPlayer object associated with the loop_list page
    would not otherwise have access to the track information it needs to play
    the loop.
    """

    def get(self, request, id, *args, **kwargs):
        loop = Drumloop.objects.get(id=id)
        tracks = (Track.objects.select_related()
                  .filter(drumloop=loop)
                  .order_by('id'))
        serializer = TrackSerializer(
            tracks, context={'request': request}, many=True)
        return Response(serializer.data)


class AddNewTrack(APIView):
    """
    This APIView accepts a POST request containing a loopID and the id of the
    instrument for this new track, and creates the track in the database. It
    displays a success message to the user, and the page then redirects itself
    back to the loop_editor page, which reloads the complete track list,
    including the new track.
    """

    def post(self, request, *args, **kwargs):
        data = request.data
        loopID = int(data.get('loopID'))
        instrumentID = int(data.get('instrumentID'))
        drumloop = Drumloop.objects.get(pk=loopID)
        instrument = Instrument.objects.get(pk=instrumentID)
        newTrack = Track(drumloop=drumloop, instrument=instrument)
        newTrack.save()
        messages.success(
            request, f'New track added, with the instrument {instrument.name}')
        return HttpResponse('Ok')


class DeleteTrack(APIView):
    """
    This APIView accepts a POST request from the loop_editor page, and deletes
    the specified track. User confirmation is supplied via a modal on the page
    itself.
    """

    def post(self, request, *args, **kwargs):
        data = request.data
        trackID = int(data.get('trackID'))
        Track.objects.get(pk=trackID).delete()
        return HttpResponse('Ok')


class DeleteLoop(APIView):
    """
    This APIView accepts a POST request from the loop_editor page, and deletes
    the specified loop. User confirmation is supplied via a modal on the page
    itself.
    """

    def post(self, request, *args, **kwargs):
        data = request.data
        loopID = int(data.get('loopID'))
        loop = Drumloop.objects.get(pk=loopID)
        loop_name = loop.name
        loop.delete()
        messages.success(request, f'{loop_name} has been deleted.')
        return HttpResponse('Ok')


class DirectURLEntryWarning(View):
    """
    This view simply returns the direct url entry warning page.
    """

    def get(self, request):
        return render(
            request,
            'url_manipulation_warning.html',
            {}
        )
