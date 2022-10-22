from . import views
from django.urls import path

urlpatterns = [
    path('', views.LoopList.as_view(), name='home'),
    path('/editor', views.LoopEditor.as_view(), name='loop_editor'),
]