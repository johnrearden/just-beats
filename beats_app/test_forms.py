from django.test import TestCase
from django.contrib.auth.models import User
from .forms import ReviewForm
from .models import Drumloop

class TestReviewForm(TestCase):

    """ def setup(self):
        user = User.objects.create(username='test', password='pass')
        drumloop = Drumloop.objects.create()
        self.fixture_form = ReviewForm({'rating': 3, 'reviewer': user, 
                           'drumloop': drumloop, 'comment': 'blah'})

    def test_fixture_form_is_valid_form(self):
        self.assertTrue(self.fixture_form.is_valid()) """

    def test_rating_must_be_greater_than_0(self):
        form = ReviewForm({'rating': -1})
        self.assertFalse(form.is_valid())

    def test_rating_must_be_less_or_equal_to_5(self):
        form = ReviewForm({'rating': 3})
        self.assertFalse(form.is_valid())

    def test_rating_for_4(self):
        user = User.objects.create(username='test', password='pass')
        drumloop = Drumloop.objects.create()
        form = ReviewForm({'rating': 3, 'reviewer': user, 
                           'drumloop': drumloop, 'comment': 'blah'})
        self.assertTrue(form.is_valid())