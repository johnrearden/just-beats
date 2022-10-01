from . import views
from django.urls import path

urlpatterns = [
    path('', views.LoopEditor.as_view(), name='drum_editor'),
]