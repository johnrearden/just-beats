# just-beats
Make your own drum loops on the web

## Purpose of Project
The aim of the project is to allow users to create and edit drum loops using
a custom GUI, and save them to a database. Users can also (if logged in) comment
on and rate other users' loops to provide a social element to the site.

![responsivenes_screenshot](media/docs/responsiveness_screenshot.png)

[Features](#Features)

[User Experience](#User-Experience)

[Development Process](#Development-Process)

[Testing](#Testing)

[Bugs](#Bugs)

[Deployment](#Deployment)

[Credits](#Credits)

## Features
- **Homepage** : 
The user is first shown a list of all the saved drumloops, ordered by rating, 
and can listen to any of these. Clicking on the play button plays the loop, and also
brings up a display at the bottom of the page with the loop name and a button to
allow the user to rate and comment on the loop (only possible with other users' loops, 
not the current user's own loops). If logged in, the user can click a button to see just 
their own loops, which will have an edit button beside them linking to the loop_editor page.
![desktop_homepage](media/docs/desktop_homepage_screenshot.png)

- **Loop Editor Page** :
The user is shown a display representing the current loop. At the top there are 3 inputs - 
Loop Name, Creator(not editable) and Tempo (a number input). Below this is a table containing
a row for each track. Each row consists of the instrument name (clickable to change instrument), 
the track volume (a slider), the beats display (a div for each beat which toggles when
clicked) and a delete button, which allows the user remove that track permanently (requires
confirmation). At the bottom are 4 buttons - Play, Add New Track, Save and Delete Loop.
The page also provides three modals; one each to confirm deletion of a track or the whole loop, 
and an instrument chooser modal which displays a table containing all available instruments, with 
the current choice highlighted.

![iphone12_editor](media/docs/iPhone12_loopeditor_screenshot.png)
![iphone12_instrument](media/docs/iPhone12_instrumentchooser_screenshot.png)

- **Loop Rating and Comments** :
The user, if logged in, can rate and comment on drumloops by other users (the rating link is
disabled for a user's own loops - you can't let people rate themselves!). All previous comments 
on the chosen loop and the respective ratings are shown in a dialog on the left hand side (on top on mobile). A simple form with 2 editable inputs - for the numerical rating and the comment - appears on the right-hand side (below on mobile).

![desktop_review](media/docs/desktop_review_screenshot.png)

- **Messaging** : 
Messaging is handled by two separate processes, both of which write to the same dedicated div just below the navbar. Standard Django messages are dispatched from the backend and displayed as the page is loaded/reloaded. As these messages are embedded in templates, they can only be shown to the user when a page is loaded. For actions that are carried out using POST requests, such as saving the tracks and loop information, JavaScript is used to write confirmation and error messages to the same div on the page. In both cases, a script removes the message again after a short delay.

![messaging_screenshot](media/docs/messaging_screenshot.png)

### Future Features
- A useful possible future feature would be the ability to accept an audio sample from the user, 
save it to media storage, and make it available to all users as one of the instrument choices once it had been approved by an admin or staff member.
- It might also be useful to use the staff feature of the Django User model to allow staff members to 
approve ratings and comments, without allowing them full admin access to the database.
- The app could be expanded to allow the use of musical instruments as well as drum beats and samples alone.


[Return to top](#just-beats)
# User Experience

## User Stories

## Design

### Wireframes
![Wireframe of drumloop list view](media/docs/drumloop_list_wireframe.png)
![Wireframe of instrument picker modal](media/docs/instrument_picker_wireframe.png)
![Wireframe of new drumloop creation form](media/docs/new_drumloop_form_wireframe.png)
![Wireframe of review creation page](media/docs/review_page_wireframe.png)


[Return to top](#just-beats)

# Development Process

## Project planning and documentation in GitHub

GitHub Issues were used to document the development steps undertaken in the project. Two issue templates, 
for [User Epics](https://github.com/johnrearden/just-beats/issues/new?assignees=&labels=&template=user-epic.md&title=USER+EPIC+%3A+%3CTITLE%3E) and [User Stories](https://github.com/johnrearden/just-beats/issues/new?assignees=johnrearden&labels=&template=user-story.md&title=USER+STORY+%3A+%3CTITLE%3E) were used. Various labels were employed to enable quick identification of issue type including Bugs, User Epics, User Stories and Style. MoSCoW prioritisation was employed using the labels must-have, should-have and could-have. 

To break the project into manageable sprints, GitHub Projects was used to provide a Kanban board
onto which the issues were posted, moving them from 'Todo' to 'In Progress' to 'Done' as they 
were completed in turn. The iterations are documented here - [Iteration 1](https://github.com/users/johnrearden/projects/4) and [Iteration 2](https://github.com/users/johnrearden/projects/5).

The User Epics and their related User Stories are as follows:
- Epic : [Create Drum Loops](https://github.com/johnrearden/just-beats/issues/2).
    - Story : [Load basic drum template](https://github.com/johnrearden/just-beats/issues/5#issue-1393424794)
    - Story : [Toggle beats on and off](https://github.com/johnrearden/just-beats/issues/6#issue-1393425523)
- Epic : [Listen to other users' loops](https://github.com/johnrearden/just-beats/issues/4)
    - Story : [Create list view of all drumloops ordered by rating]()
    - Story : [Allow user to preview loops without switching to loop editor view](https://github.com/johnrearden/just-beats/issues/19)
- Epic : [Create an account](https://github.com/johnrearden/just-beats/issues/1)
    - Story : [User account creation using all-auth](https://github.com/johnrearden/just-beats/issues/15#issue-1406144429)
    - Story : [Styling the user account views](https://github.com/johnrearden/just-beats/issues/16)
    - Story : [Social sign in](https://github.com/johnrearden/just-beats/issues/17)
- Epic : [Play drum loops](https://github.com/johnrearden/just-beats/issues/10)
    - Story : [Play/pause drumloop audio](https://github.com/johnrearden/just-beats/issues/11)
    - Story : [Change track volume](https://github.com/johnrearden/just-beats/issues/12)
- Epic : [Edit my drum loops](https://github.com/johnrearden/just-beats/issues/3)
    - Story : [Add new track to drumloop](https://github.com/johnrearden/just-beats/issues/7#issue-1393427818)
    - Story : [Change instrument on a track](https://github.com/johnrearden/just-beats/issues/8#issue-1393428524)
    - Story : [Change drumloop tempo](https://github.com/johnrearden/just-beats/issues/13#issue-1393439736)
    - Story : [Save drumloop](https://github.com/johnrearden/just-beats/issues/9#issue-1393429114)
    - Story : [Delete existing track](https://github.com/johnrearden/just-beats/issues/21#issue-1428735119)
- Epic : [Rating other users' loops](https://github.com/johnrearden/just-beats/issues/22)
    - Story : [Give a star rating to someone else's loop](https://github.com/johnrearden/just-beats/issues/23#issue-1436561054)
    - Story : [Make a comment on someone else's loop](https://github.com/johnrearden/just-beats/issues/24#issue-1436564637)
    - Story : [Allow admin to moderate comments before publishing](https://github.com/johnrearden/just-beats/issues/25)

### Inline JavaScript and event handlers.
When using Django templates, the fields passed in from the backend are only 
available within the HTML document itself. It is therefore simpler to write event
handlers directly into the document, rather than in external JS files. This means that
the HTML and JavaScript are tightly coupled, but this would be necessary in any case 
in the absence of direct fetch calls to the API. 

## Data Model

![Entity-relationship diagram for models](media/docs/entity_relationship_diagram.png)

# Testing
- Manual testing
- Automated testing
Note - tried using nose as the test runner, but it doesn't pick up model coverage as 
these are loaded before test run starts.https://github.com/jazzband/django-nose/issues/180
- In-app testing
- User story testing
- Validator testing

## Manual Testing

### Responsiveness
Here's a set of screenshots taken with the Chrome dev tools device toolbar, set
to the iPhone 12 Pro. They are, in order, the homepage, loop editor page, instrument chooser page, 
and the review form.

![iphone12_homepage](media/docs/iPhone12_homepage_screenshot.png)
![iphone12_editor](media/docs/iPhone12_loopeditor_screenshot.png)
![iphone12_instrument](media/docs/iPhone12_instrumentchooser_screenshot.png)
![iphone12_review](media/docs/iPhone12_commentform_screenshot.png)

Here's the same four pages on the Surface Pro 7

![surfacepro_homepage](media/docs/surface_pro_homepage_screenshot.png)
![surfacepro_editor](media/docs/surface_pro_editor_screenshot.png)
![surfacepro_instrument](media/docs/surface_pro_instrumentchooser_screenshot.png)
![surfacepro_review](media/docs/surface_pro_review_screenshot.png)

And finally the same four pages on a desktop monitor (1920x1080)

![desktop_homepage](media/docs/desktop_homepage_screenshot.png)
![desktop_editor](media/docs/desktop_editor_screenshot.png)
![desktop_instrument](media/docs/desktop_instrumentchooser_screenshot.png)
![desktop_review](media/docs/desktop_review_screenshot.png)

### Browser Compatibility

| Feature | Chrome | Firefox | Safari(mobile) |
--- | --- | --- | --- | 
Audio playback upon first user interaction | True | True | True
Fonts render correctly | True | True | True
All elements visible | True | True | True 
Pages are responsive at all screen sizes | True | True | True
### Lighthouse

### Code Validation

#### Python code : 
All python code is validated by both the Flake8 linter (installed in VSCode) and the external CodeInstitute validator @ https://pep8ci.herokuapp.com/. The sole exceptions are the test classes, 

### User Stories

### Features

## Automated Testing

### Testing django views, models and forms.
Automated tests were written for all forms, models and views using the Django testing framework. 
- Models: 
    - Each model was tested to ensure that object creation resulted in the correct application of supplied field values, and the correct injection of default values where these were absent. 
    - The relevant validators were also tested with illegal input to ensure that they raised ValidationErrors. 
    - For the sake of getting to 100% coverage, the __str__ methods of each model were also tested to ensure appropriate output. The string methods were tested not for exact match, but for containing the relevant fields, to allow for rewording of the string methods while retaining the essential output. IMO, this makes the tests a little less brittle.
- Forms:  
    - The ReviewForm was tested to ensure its rating value had to be within bounds, and that a comment
    had to be provided in order for the is_valid() method to return True.
    - The ReviewForm widget class names were tested to ensure that they would remain hidden to the user.
    - The NewDrumloopForm was tested to ensure that the loop name was required. 
- Views: 
    - All view get methods were tested to ensure that they return a 200, and that the correct template
    was used for all standard (Non-API) views.
    - All view post methods were tested to ensure that they return a 200 if appropriate, and that any
    object data posted results in the creation of the correct object.
- Serializers were not tested, as this would amount to testing Django functionality.

The nose test runner was installed, which conveniently runs the coverage report and html generation as part of the test suite, but unfortunately it turned out that nose loads the models before running the tests, so that the model code is never accessed during the tests themselves, and thus does not show up
in the coverage report. This is a deal-breaker, as the html coverage report is very useful for finding
untested parts of the codebase.

### Testing page functionality with Selenium
Note - writing of tests was considerably slowed down by an issue with actions fired by selenium 
resulting in changes to the development database, rather than the testing database. The url used for testing should be localhost, but the port used is assigned dynamically, and should be accessed using self.live_server_url. Unfortunately, I initally set the selenium webdriver to connect to localhost at port 8000, the default django server, and I didn't detect the problem because the dev server was actually running as I was writing the tests. This resulted in the dev database being used rather than the test database, and so a test involving user registration actions passed the first time with a test username, and subsequently failed due to fact that the database was not being destroyed after test runs. Solution found here https://stackoverflow.com/questions/17435155/django-functional-liveservertestcase-after-submitting-form-with-selenium-obje. 

Also, it was necessary to use the default static storage in place of Cloudinary's static hashed storage
to run the selenium based tests, so a conditional statement was added to settings.py to detect if a test was being run or not.

[Return to top](#just-beats)

# Bugs

Google social authentication: Error 400 redirect_uri_mismatch. The problem was caused by the redirect uri
I supplied to Google when setting up the credentials having a missing trailing slash at the end. 
https://www.youtube.com/watch?v=QHz1Rs6lZHQ&t=1s

Problem with setTimeout and this.
I originally wrote the LoopPlayer class using the ES6 constructor syntax, but using
arrow functions syntax in the function definitions. 

`scheduler = () => { .... }`

JSHint did not approve, so I changed the function definitions to the standard class syntax.

`scheduler() { ...... }`

This introduced a bug which was equal parts annoying and interesting. At the end of the scheduler function, it invokes itself again after a delay using setTimeout. Removing the arrow syntax from the
function definitions resulted in the value of this being reset to the global context, which didn't have access to the AudioContext created within the class constructor.
 - Solution : I wrapped the schedule function call inside a wrapper function and bound this
 to the correct context. The [MDN docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this#as_an_object_method) and [this stack overflow reply](
https://stackoverflow.com/questions/591269/settimeout-and-this-in-javascript) were very helpful.
## Solved Bugs

## Remaining Bugs
There are (hopefully) no remaining bugs in the project.

[Return to top](#just-beats)

## Libraries and Programs Used
1. [Lucid](https://www.lucidchart.com/pages/)
    - Lucid charts were used to create the execution path diagrams.
2. [Heroku](https://www.heroku.com/)
    - Heroku was used to deploy the project
3. [Git](https://git-scm.com/)
    - Version control was implemented using Git through the Github terminal.
4. [Github](https://github.com/)
    - Github was used to store the projects after being pushed from Git and its cloud service [Github Pages](https://pages.github.com/) was used to serve the project on the web.
5. [Visual Studio Code](https://code.visualstudio.com/)
    - VS Code was used locally as the main IDE environment, primarily because it was easier to set up a development environment locally than in GitPod (I wasn't sure how to persist the Jest installation across different GitPod sessions)
6. [PyCharm-Community](https://www.jetbrains.com/pycharm/)
    - I switched to PyCharm towards the end of the project, as it has better support for PEP8 compliance.
7. [pytest](https://docs.pytest.org/en/7.1.x/)
    - Pytest was used for automated testing.

## Deployment

[Return to top](#just-beats)
## Credits
Cloning a string in javascript:
https://stackoverflow.com/questions/31712808/how-to-force-javascript-to-deep-copy-a-string

Creating an audio sequencer:
https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques

Bit shifting in Javascript:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift

Hashing a string: 
https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript

Configuring Google social login using allauth
https://django-allauth.readthedocs.io/en/latest/installation.html

Django authentication with Google
https://www.codeunderscored.com/django-authentication-with-google/

Get csrf cookie for POST request
https://www.brennantymrak.com/articles/fetching-data-with-ajax-and-django.html

Testing Djando form widget fields
https://stackoverflow.com/questions/50643143/testing-form-field-widget-type

login_required decorator
Thanks to Jose Guerra, from my cohort

Hiding Django messages after a short delay: Code Institute video.
https://learn.codeinstitute.net/courses/course-v1:CodeInstitute+FST101+2021_T1/courseware/b31493372e764469823578613d11036b/ae7923cfce7f4653a3af9f51825d2eba/


[Return to top](#just-beats)
