from django import forms
from .models import Drumloop

class NewDrumloopForm(forms.ModelForm):
    class Meta:
        model = Drumloop
        fields = ('name', 'tempo',)