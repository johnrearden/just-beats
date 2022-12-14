from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import User
from django.template.defaultfilters import slugify


class Drumloop(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=50, null=True, blank=True)
    creator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="drumloops")
    created_on = models.DateTimeField(auto_now_add=True)
    rating = models.FloatField(default=0, validators=[
        MinValueValidator(0), MaxValueValidator(5)
    ])
    tempo = models.IntegerField(default=120, validators=[
                                MaxValueValidator(200), MinValueValidator(60)])

    def __str__(self):
        return f"{self.name}, tempo={self.tempo}"

    def save(self, *args, **kwargs):
        self.slug = slugify(self.name)
        super().save(*args, **kwargs)


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
    beats = models.CharField(max_length=32, default="0" * 32)
    track_volume = models.IntegerField(
        default=10, validators=[MaxValueValidator(10), MinValueValidator(0)])

    def __str__(self):
        return (f"{self.instrument}:{self.beats},trk_vol={self.track_volume},"
                f" belongs to {self.drumloop.name}")


class Review(models.Model):
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE,
                                 related_name='reviewers')
    drumloop = models.ForeignKey(Drumloop, on_delete=models.CASCADE,
                                 related_name='loops')
    rating = models.IntegerField(default=0, validators=[MaxValueValidator(5),
                                 MinValueValidator(0)])
    comment = models.TextField(max_length=100)
    created_on = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)

    def __str__(self):
        return (f"Review of {self.drumloop.name} by {self.reviewer.username}"
                f" - stars = {self.rating}")
