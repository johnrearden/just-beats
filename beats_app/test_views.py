from django.test import TestCase
from django.contrib.auth.models import User
from .models import Drumloop, Track, Instrument, Review


class TestViews(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.test_instrument = Instrument.objects.create(
            name='Snare', url='audio/snare.wav')
        cls.test_user = User.objects.create(username='test', password='pass')
        cls.test_drumloop = Drumloop.objects.create(creator=cls.test_user)
        cls.test_track = Track.objects.create(drumloop=cls.test_drumloop,
                                              instrument=cls.test_instrument,
                                              beats="8888",
                                              track_volume='8')

    def test_get_looplist(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'loop_list.html', 'base.html')

    def test_get_create_new_loop(self):
        response = self.client.get('/create_new_loop/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'base.html',
                                'new_drumloop_form.html')

    def test_post_new_loop(self):
        user = User.objects.create(username='name', password='pass')
        response = self.client.post(
            '/create_new_loop/', {'name': 'test_name', 'tempo': '42', 'creator': user.pk})
        newly_created_drumloop = Drumloop.objects.get(name='test_name')
        self.assertRedirects(response, f'/editor/{newly_created_drumloop.pk}')

    def test_get_review_drumloop(self):
        url = f'/create_review/{self.test_drumloop.pk}/{self.test_user.username}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'review_form.html')

    def test_save_review_with_valid_form_data(self):
        data = {
            'drumloop': self.test_drumloop.pk,
            'rating': 3,
            'comment': 'Random comment',
            'reviewer': self.test_user.pk,
        }
        response = self.client.post('/save_review/', data)
        queryset = Review.objects.all()
        self.assertGreater(len(queryset), 0)
        self.assertRedirects(response, '/')

    def test_save_review_with_invalid_form_data(self):
        data = {
            'drumloop': self.test_drumloop.pk,
            'rating': 6,  # Range is 0 to 5
            'comment': 'Random comment',
            'reviewer': self.test_user.pk,
        }
        response = self.client.post('/save_review/', data)
        queryset = Review.objects.all()
        self.assertEqual(len(queryset), 0)
        self.assertTemplateUsed(response, 'review_form.html')

    def test_get_loop_editor(self):
        url = f'/editor/{self.test_drumloop.pk}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'loop_editor.html')

    def test_post_to_save_loop_and_tracks_view(self):
        data = {
            'loopID': self.test_drumloop.pk,
            'name': self.test_drumloop.name,
            'tempo': self.test_drumloop.tempo,
            'trackList': [
                {
                    'trackID': self.test_track.pk,
                    'beats': self.test_track.beats,
                    'volume': self.test_track.track_volume,
                    'instrumentID': self.test_instrument.pk,
                }
            ]
        }
        response = self.client.post('/save_loop_and_tracks/', data,
                                    content_type='application/json')
        queryset = Drumloop.objects.all()
        self.assertGreater(len(queryset), 0)
        self.assertEqual(response.status_code, 200)

    def test_get_tracks_for_loop_view(self):
        url = f'/tracks/{self.test_drumloop.pk}'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    def test_add_new_track_view(self):
        data = {
            'loopID': self.test_drumloop.pk,
            'instrumentID': self.test_instrument.pk,
        }
        response = self.client.post(
            '/add_new_track/', data, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        queryset = Track.objects.all().filter(drumloop=self.test_drumloop).values()
        self.assertGreater(len(queryset), 0)

    def test_delete_track_view(self):
        temp_test_track = Track.objects.create(
            drumloop=self.test_drumloop,
            instrument=self.test_instrument,
            beats='8888',
            track_volume=8)
        data = {'trackID': temp_test_track.pk}
        response = self.client.post('/delete_track/', data, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        queryset = Track.objects.all().filter(id=temp_test_track.id).values()
        self.assertEqual(len(queryset), 0)
