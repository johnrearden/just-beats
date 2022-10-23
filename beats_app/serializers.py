from rest_framework import serializers
from .models import Track

class TrackSerializer(serializers.ModelSerializer):

    class Meta:
        model = Track
        fields = ('pk', 'drumloop', 'instrument', 'beats', 'beat_volumes', 
                  'track_volume')