from . import views
from django.urls import path
from django.contrib.auth.decorators import login_required

urlpatterns = [
    path('', views.LoopList.as_view(), name='home'),
    path('/<str:selection>', views.LoopList.as_view(), name='home'),
    path('create_new_loop/', login_required(views.CreateNewLoop.as_view()),
         name='new_drumloop_form'),
    path('delete_loop/', views.DeleteLoop.as_view(), name='delete_loop'),
    path('editor/<int:id>', login_required(views.LoopEditor.as_view()),
         name='loop_editor'),
    path('tracks/<int:id>', login_required(views.TracksForLoop.as_view()),
         name='tracks'),
    path('add_new_track/', login_required(views.AddNewTrack.as_view()),
         name='add_new_track'),
    path('delete_track/', login_required(views.DeleteTrack.as_view()),
         name='delete_track'),
    path('save_loop_and_tracks/', 
         login_required(views.SaveLoopAndTracks.as_view()),
         name='save_loop_and_tracks'),
    path('create_review/<int:id>/<str:username>/',
         login_required(views.ReviewDrumloop.as_view()),
         name='review_drumloop'),
    path('save_review/', login_required(views.SaveReview.as_view()),
         name="save_review"),
    path('direct_url_entry_warning/', views.DirectURLEntryWarning.as_view(),
         name='direct_url_entry_warning'),
]
