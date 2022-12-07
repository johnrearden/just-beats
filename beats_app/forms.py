from django import forms
from django.forms import Textarea, HiddenInput, NumberInput, TextInput
from .models import Drumloop, Review


class NewDrumloopForm(forms.ModelForm):
    class Meta:
        model = Drumloop
        fields = ('name', 'tempo',)
        widgets = {
            'tempo': NumberInput(attrs={
                'max': 200,
                'min': 60,
            }),
            'name': TextInput(attrs={
                'placeholder': 'Enter a name'
            })
        }


class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ('drumloop', 'rating', 'comment', 'reviewer',)
        widgets = {
            'comment': Textarea(attrs={
                'class': 'form-control custom-text-area',
                'rows': 3,
                'placeholder': 'Enter your comment here ...',
                'maxlength': 100,
            }),
            'rating': NumberInput(attrs={
                'max': 5,
                'min': 0
            }),
            'drumloop': HiddenInput(),
            'reviewer': HiddenInput(),
        }
