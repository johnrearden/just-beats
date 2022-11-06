from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class Drumloop(models.Model):
    name = models.CharField(max_length=50, unique=True,
                            default="brand_new_loop")
    creator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="drumloops", default=1)
    created_on = models.DateTimeField(auto_now_add=True)
    rating = models.IntegerField(default=0, validators=[
        MinValueValidator(0), MaxValueValidator(5)
    ])
    tempo = models.IntegerField(default=120, validators=[
                                MaxValueValidator(200), MinValueValidator(60)])

    def __str__(self):
        return f"{self.name}, tempo={self.tempo}"


class Instrument(models.Model):
    name = models.CharField(max_length=50, unique=True)
    url = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Track(models.Model):
    drumloop = models.ForeignKey(
        Drumloop, on_delete=models.CASCADE, related_name="tracks")
    instrument = models.ForeignKey(
        Instrument, on_delete=models.CASCADE, related_name="tracks")
    beats = models.CharField(max_length=32, default="00000000000000000000000000000000")
    track_volume = models.IntegerField(
        default=10, validators=[MaxValueValidator(10), MinValueValidator(0)])

    def __str__(self):
        return f"{self.instrument}: {self.beats}, trk_vol={self.track_volume}, belongs to {self.drumloop.name}"

class Review(models.Model):
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviewers')
    drumloop = models.ForeignKey(Drumloop, on_delete=models.CASCADE, related_name='loops')
    rating = models.IntegerField(default=0, validators=[MaxValueValidator(5), MinValueValidator(0)])
    comment = models.TextField(default='No comment', max_length=200)
    created_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review of {self.drumloop.name} by {self.reviewer.username} - stars = {self.rating}"