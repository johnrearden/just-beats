from . import views
from django.urls import path

urlpatterns = [
    path('', views.LoopList.as_view(), name='home'),
    path('create_new_loop/', views.CreateNewLoop.as_view(), name='new_drumloop_form'),
    path('editor/<int:id>', views.LoopEditor.as_view(), name='loop_editor'),
    path('tracks/<int:id>', views.TracksForLoop.as_view(), name='tracks'),
    path('add_new_track/', views.AddNewTrack.as_view(), name='add_new_track'),
    path('delete_track/', views.DeleteTrack.as_view(), name='delete_track'),
    path('save_loop_and_tracks/', views.SaveLoopAndTracks.as_view(), name='save_loop_and_tracks'),
]