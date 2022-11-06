from django import forms
from .models import Drumloop, Review

class NewDrumloopForm(forms.ModelForm):
    class Meta:
        model = Drumloop
        fields = ('name', 'tempo',)

class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ('rating', 'comment')