from rest_framework import serializers
from .models import Track

class TrackSerializer(serializers.ModelSerializer):

    instrument_url = serializers.CharField(read_only=True, source="instrument.url")
    instrument_id = serializers.CharField(read_only=True, source="instrument.id")

    class Meta:
        model = Track
        fields = ('pk', 'drumloop', 'instrument_url', 'beats', 
                  'track_volume', 'instrument_id')