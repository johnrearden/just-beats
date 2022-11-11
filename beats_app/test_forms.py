from django.test import TestCase
from django.contrib.auth.models import User
from .forms import ReviewForm, NewDrumloopForm
from .models import Drumloop

class TestReviewForm(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.test_user = User.objects.create(username='form_tester', password='pass')
        drumloop = Drumloop.objects.create(creator=cls.test_user, name='form_tester_loop')
        cls.test_form = ReviewForm({
            'reviewer': cls.test_user, 
            'drumloop': drumloop,
            'rating': 0, 
            'comment': 'A comment'})

    def test_that_test_form_is_valid_form(self):
        self.assertTrue(self.test_form.is_valid())

    def test_rating_must_be_greater_than_0(self):
        user = User.objects.create(username='form_tester_1', password='pass')
        drumloop = Drumloop.objects.create(creator=user, name='form_tester_loop_1')
        test_form = ReviewForm({
            'reviewer': user, 
            'drumloop': drumloop,
            'rating': -1, 
            'comment': 'A comment'})
        self.assertFalse(test_form.is_valid())
        self.assertIn('rating', test_form.errors.keys())

    def test_rating_must_be_less_or_equal_to_5(self):
        user = User.objects.create(username='form_tester_2', password='pass')
        drumloop = Drumloop.objects.create(creator=user, name='form_tester_loop_2')
        test_form = ReviewForm({
            'reviewer': user, 
            'drumloop': drumloop,
            'rating': 10, 
            'comment': 'A comment'})
        self.assertFalse(test_form.is_valid())
        self.assertIn('rating', test_form.errors.keys())

    def test_rating_of_3(self):
        user = User.objects.create(username='test', password='pass')
        drumloop = Drumloop.objects.create(creator=user)
        form = ReviewForm({'rating': 3, 'reviewer': user, 
                           'drumloop': drumloop, 'comment': 'blah'})
        self.assertTrue(form.is_valid())

    def test_comment_is_required(self):
        user = User.objects.create(username='form_tester_3', password='pass')
        drumloop = Drumloop.objects.create(creator=user, name='form_tester_loop_3')
        form = ReviewForm({'rating': 3, 'reviewer': user, 
                           'drumloop': drumloop})
        self.assertFalse(form.is_valid())
        self.assertIn('comment', form.errors.keys())

    def test_drumloop_field_is_hidden(self):
        self.assertEqual(self.test_form.fields['drumloop'].widget.__class__.__name__, 'HiddenInput')

    def test_reviewer_field_is_hidden(self):
        self.assertEqual(self.test_form.fields['reviewer'].widget.__class__.__name__, 'HiddenInput')


class TestNewDrumloopForm(TestCase):

    @classmethod
    def setUpTestData(cls):
        cls.test_user = User.objects.create(username='Bo', password="Diddly")

    def test_loop_name_is_required(self):
        form = NewDrumloopForm({'name': ''})
        self.assertFalse(form.is_valid())

    def test_name_must_be_unique(self):
        same_name = 'same_name'
        form = NewDrumloopForm({'name': same_name})
        self.assertFalse(form.is_valid())

    def test_tempo_must_be_within_bounds(self):
        form = NewDrumloopForm({'name': 'tempo_tester', 'tempo': '10000'})
        self.assertFalse(form.is_valid())
        self.assertIn('tempo', form.errors.keys())

    