from django.test import TestCase
from .models import Drumloop, Instrument, Track, Review
from django.contrib.auth.models import User
from django.db.utils import IntegrityError
from django.core.exceptions import ValidationError
from datetime import datetime


class TestModels(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.test_user = User.objects.create(
            username='test_user', password='pass')
        cls.test_instrument = Instrument.objects.create(
            name='drum', url='audio/drum.wav')
        cls.test_drumloop = Drumloop.objects.create(
            creator=cls.test_user, name="model_tester")

    @classmethod
    def clean_it(cls, model):
        model.full_clean()

    def test_drumloop_model(self):
        loop = Drumloop.objects.create(creator=self.test_user)
        self.assertEqual(loop.name, '')
        self.assertEqual(loop.tempo, 120)
        self.assertEqual(loop.rating, 0)
        self.assertIsInstance(loop.created_on, datetime)

    def test_drumloop_str_method(self):
        name = self.test_drumloop.name
        tempo = self.test_drumloop.tempo
        self.assertIn(name, self.test_drumloop.__str__())
        self.assertIn(str(tempo), self.test_drumloop.__str__())

    def test_drumloop_creation_fails_without_user(self):
        def create_loop_without_user():
            Drumloop.objects.create()
        self.assertRaises(IntegrityError, lambda: create_loop_without_user())

    def test_drumloop_creation_fails_with_out_of_bounds_rating(self):
        drumloop = Drumloop.objects.create(creator=self.test_user, rating=100)
        self.assertRaises(ValidationError, lambda: self.clean_it(drumloop))

    def test_instrument_creation(self):
        self.assertEqual(self.test_instrument.name, 'drum')
        self.assertEqual(self.test_instrument.url, 'audio/drum.wav')

    def test_instrument_str_method(self):
        self.assertEqual(self.test_instrument.__str__(), 'drum')

    def test_track_creation_with_supplied_values(self):
        beats = '8888'
        track_volume = 8
        track = Track.objects.create(
            beats=beats,
            track_volume=track_volume,
            drumloop=self.test_drumloop,
            instrument=self.test_instrument)
        self.assertEqual(track.beats, '8888')
        self.assertEqual(track_volume, 8)

    def test_track_creation_with_default_values(self):
        track = Track.objects.create(
            drumloop=self.test_drumloop,
            instrument=self.test_instrument)
        self.assertEqual(track.track_volume, 10)
        self.assertEqual(track.beats, '0' * 32)

    def test_track_creation_with_out_of_range_volume(self):
        track = Track.objects.create(
            drumloop=self.test_drumloop,
            instrument=self.test_instrument,
            track_volume=11)

        self.assertRaises(ValidationError, lambda: self.clean_it(track))

    def test_track_creation_with_oversize_beats_field(self):
        track = Track.objects.create(
            drumloop=self.test_drumloop,
            instrument=self.test_instrument,
            beats='0'*33)

        self.assertRaises(ValidationError, lambda: self.clean_it(track))

    def test_track_str_method(self):
        beats = '8888'
        track_volume = 8
        track = Track.objects.create(
            beats=beats,
            track_volume=track_volume,
            drumloop=self.test_drumloop,
            instrument=self.test_instrument)
        correct_output = (f'{self.test_instrument.name}:{beats},'
                          f'trk_vol={track_volume}, belongs to '
                          f'{track.drumloop.name}')
        self.assertEqual(track.__str__(), correct_output)

    def test_review_creation(self):
        review = Review.objects.create(
            reviewer=self.test_user,
            drumloop=self.test_drumloop,
            rating=3,
            comment='Random comment',
        )
        self.assertEqual(review.reviewer.username, 'test_user')
        self.assertFalse(review.approved)
        self.assertIsInstance(review.created_on, datetime)

    def test_review_str_method(self):
        review = Review.objects.create(
            reviewer=self.test_user,
            drumloop=self.test_drumloop,
            rating=3,
            comment='Random comment',
        )
        correct_output = (f'Review of {self.test_drumloop.name} by '
                          f'{self.test_user.username} - stars = '
                          f'{review.rating}')
        self.assertEqual(review.__str__(), correct_output)
        self.assertIn(self.test_drumloop.name, review.__str__())
        self.assertIn(self.test_user.username, review.__str__())
        self.assertIn(str(review.rating), review.__str__())
