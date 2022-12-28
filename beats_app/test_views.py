from django.test import TestCase, RequestFactory
from django.contrib.auth.models import User
from .models import Drumloop, Track, Instrument, Review
from .views import LoopEditor


class TestViews(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.test_instrument = Instrument.objects.create(
            name='Snare', url='audio/snare.wav')
        cls.TEST_USERNAME = 'test'
        cls.TEST_USERNAME2 = 'test2'

        cls.TEST_PASSWORD = 'pass'
        cls.test_user = User.objects.create_user(username=cls.TEST_USERNAME,
                                                 password=cls.TEST_PASSWORD)
        cls.test_user2 = User.objects.create_user(username=cls.TEST_USERNAME2,
                                                  password=cls.TEST_PASSWORD)
        cls.test_drumloop = Drumloop.objects.create(creator=cls.test_user,
                                                    name='loopname')
        cls.test_track = Track.objects.create(drumloop=cls.test_drumloop,
                                              instrument=cls.test_instrument,
                                              beats="8888",
                                              track_volume='8')
        cls.test_review = Review.objects.create(reviewer=cls.test_user,
                                                drumloop=cls.test_drumloop,
                                                rating=3,
                                                comment="A comment",
                                                approved=True)
        cls.factory = RequestFactory()

    def setUp(self):
        self.client.login(username=self.TEST_USERNAME,
                          password=self.TEST_PASSWORD)

    def test_get_looplist_with_all_loops(self):
        response = self.client.get('/')
        self.assertTemplateUsed(response, 'loop_list.html', 'base.html')
        self.assertEqual(response.status_code, 200)

    def test_get_looplist_with_user_only_loops(self):
        self.client.login(username=self.test_user.username,
                          password=self.test_user.password)
        response = self.client.get('/home/user-only')
        self.assertTemplateUsed(response, 'loop_list.html')

    def test_get_create_new_loop(self):
        response = self.client.get('/create_new_loop/')
        self.assertTemplateUsed(response, 'base.html',
                                'new_drumloop_form.html')
        self.assertEqual(response.status_code, 200)

    def test_post_new_loop(self):
        orig_loop_count = Drumloop.objects.count()
        self.client.login(username=self.test_user.username,
                          password=self.test_user.password)
        self.client.post(
            '/create_new_loop/',
            {'name': 'test_name', 'tempo': '70', 'creator': self.test_user.pk})
        newly_created_drumloop = Drumloop.objects.get(name='test_name')
        self.assertEqual(newly_created_drumloop.creator, self.test_user)
        self.assertEqual(Drumloop.objects.count(), orig_loop_count + 1)

    def test_get_review_drumloop(self):
        url = (f'/create_review/{self.test_drumloop.pk}'
               f'/{self.test_user.username}/')
        response = self.client.get(url)
        self.assertTemplateUsed(response, 'review_form.html')
        self.assertEqual(response.status_code, 200)

    def test_get_review_drumloop_with_existing_reviews(self):
        Review.objects.create(reviewer=self.test_user,
                              drumloop=self.test_drumloop,
                              rating=3,
                              comment="A comment",
                              approved=True)
        url = (f'/create_review/{self.test_drumloop.pk}'
               f'/{self.test_user.username}/')
        response = self.client.get(url)
        self.assertTemplateUsed(response, 'review_form.html')
        self.assertEqual(response.status_code, 200)

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
        drumloop_rating = Drumloop.objects.get(id=self.test_drumloop.pk).rating
        self.assertEqual(drumloop_rating, 3)
        self.assertRedirects(response, '/')

    def test_save_review_with_invalid_form_data(self):
        existing_review_count = len(Review.objects.all())
        data = {
            'drumloop': self.test_drumloop.pk,
            'rating': 6,  # Range is 0 to 5
            'comment': 'Random comment',
            'reviewer': self.test_user.pk,
        }
        response = self.client.post('/save_review/', data)
        queryset = Review.objects.all()
        self.assertEqual(len(queryset), existing_review_count)
        self.assertTemplateUsed(response, 'review_form.html')

    def test_save_review_with_existing_reviews(self):
        Review.objects.create(reviewer=self.test_user,
                              drumloop=self.test_drumloop,
                              rating=3,
                              comment="A comment",
                              approved=True)
        data = {
            'drumloop': self.test_drumloop.pk,
            'rating': 3,
            'comment': 'Random comment',
            'reviewer': self.test_user.pk,
        }
        response = self.client.post('/save_review/', data)
        queryset = Review.objects.all()
        self.assertGreater(len(queryset), 0)
        drumloop_rating = Drumloop.objects.get(id=self.test_drumloop.pk).rating
        self.assertEqual(drumloop_rating, 3)
        self.assertRedirects(response, '/')

    def test_get_loop_editor(self):
        url = f'/editor/{self.test_drumloop.pk}'
        request = self.factory.get(url)
        request.user = self.test_user
        response = LoopEditor().get(request)
        self.assertEqual(response.status_code, 200)

    def test_get_loop_editor_with_illegal_user(self):
        url = f'/editor/{self.test_drumloop.pk}'
        request = self.factory.get(url)
        request.user = self.test_user2
        response = LoopEditor().get(request)
        self.assertEqual(response.url, "/direct_url_entry_warning")
        self.assertEqual(response.status_code, 302)

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
        queryset = Track.objects.all().filter(
            drumloop=self.test_drumloop).values()
        self.assertGreater(len(queryset), 0)
        self.assertEqual(response.status_code, 200)

    def test_delete_track_view(self):
        temp_test_track = Track.objects.create(
            drumloop=self.test_drumloop,
            instrument=self.test_instrument,
            beats='8888',
            track_volume=8)
        data = {'trackID': temp_test_track.pk}
        response = self.client.post('/delete_track/', data,
                                    content_type='application/json')
        queryset = Track.objects.all().filter(id=temp_test_track.id).values()
        self.assertEqual(len(queryset), 0)
        self.assertEqual(response.status_code, 200)

    def test_loop_detail_view(self):
        url = f'/loop/{self.test_drumloop.slug}/'
        response = self.client.get(url)
        self.assertTemplateUsed(response, 'loop_detail.html')
        self.assertEqual(response.status_code, 200)

    def test_delete_loop(self):
        data = {'loopID': self.test_drumloop.pk}
        self.client.login(username=self.test_user.username,
                          password=self.test_user.password)
        self.client.post(
            '/delete_loop/', data)
        queryset = Drumloop.objects.all()
        self.assertFalse(queryset)

    def test_direct_url_entry_warning(self):
        response = self.client.get('/direct_url_entry_warning/')
        self.assertTemplateUsed(response, 'url_manipulation_warning.html')
        self.assertEqual(response.status_code, 200)
