# just-beats
Make your own drum loops on the web

[Screenshots](#Screenshots)

[Features](#Features)

[User Experience](#User-Experience)

[Development Process](#Development-Process)

[Testing](#Testing)

[Bugs](#Bugs)

[Deployment](#Deployment)

[Credits](#Credits



## Screenshots


[Return to top](#just-beats)

## Features

### Future Features


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

## User Story Testing

## Validator Testing

[Return to top](#just-beats)

# Bugs

Google social authentication: Error 400 redirect_uri_mismatch. The problem was caused by the redirect uri
I supplied to Google when setting up the credentials having a missing trailing slash at the end. 
https://www.youtube.com/watch?v=QHz1Rs6lZHQ&t=1s

## Solved Bugs

## Remaining Bugs

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
Jose Guerra, from my cohort


[Return to top](#just-beats)
