from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from django.contrib.auth.models import User

class Drumloop(models.Model):
    name = models.CharField(max_length=50, unique=True, default="brand_new_loop")
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="drumloops", default=1)
    created_on = models.DateTimeField(auto_now_add=True)
    allow_copy = models.BooleanField(default=True)
    tempo = models.IntegerField(default=120, validators=[MaxValueValidator(200), MinValueValidator(60)])

    def __str__(self):
        return f"{self.name}, tempo={self.tempo}, {'(can be copied)' if self.allow_copy else '(copying not allowed)'}"


class Instrument(models.Model):
    name = models.CharField(max_length=50, unique=True)
    url = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Track(models.Model):
    drumloop = models.ForeignKey(Drumloop, on_delete=models.CASCADE, related_name="tracks")
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name="tracks")
    beats = models.CharField(max_length=32)
    beat_volumes = models.CharField(max_length=32)
    track_volume = models.IntegerField(default=10, validators=[MaxValueValidator(10), MinValueValidator(0)])

    def __str__(self):
        return f"{self.instrument}: {self.beats}, {self.beat_volumes}, trk_vol={self.track_volume}, belongs to {self.drumloop.name}"
