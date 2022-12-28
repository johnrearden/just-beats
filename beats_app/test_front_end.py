import time
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.conf import settings
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from .models import Review, Drumloop, Track


class TestLoopList(StaticLiveServerTestCase):

    fixtures = ['db_fixture.json', 'users.json']

    def setUp(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        # necessary for headless
        options.add_argument("--allow-insecure-localhost")
        # due to local port conflict
        options.add_argument("--remote-debugging-port=9221")
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(1)
        self.BASE_URL = self.live_server_url + '/'

    def tearDown(self):
        self.driver.quit()

    def test_create_new_loop_button(self):

        # Find and click the signup link on the login page
        self.driver.get(self.BASE_URL)
        signup_link = self.driver.find_element(by=By.ID, value='register-link')
        signup_link.click()

        # Enter and submit a testing username and password
        username = self.driver.find_element(by=By.NAME, value='username')
        password = self.driver.find_element(by=By.NAME, value='password1')
        password_confirm = self.driver.find_element(
            by=By.NAME, value='password2')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_TEST_USERNAME)
        password.send_keys(settings.SELENIUM_TEST_PASSWORD)
        password_confirm.send_keys(settings.SELENIUM_TEST_PASSWORD)
        submit.click()

        # Now test the create new loop button, which only appears to logged
        # in users.
        self.driver.get(self.BASE_URL)
        create_new_loop_button = self.driver.find_element(
            by=By.ID, value='create-new-loop-button')
        create_new_loop_button.click()
        self.assertEqual(self.driver.current_url,
                         self.BASE_URL + 'create_new_loop/')


class TestAllAuthFunctionality(StaticLiveServerTestCase):

    def setUp(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        # necessary for headless
        options.add_argument("--allow-insecure-localhost")
        # due to local port conflict
        options.add_argument("--remote-debugging-port=9221")
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(1)
        self.BASE_URL = self.live_server_url + '/'

    def tearDown(self):
        self.driver.quit()

    # These tests test the login, logout and register functionality of the
    # base.html template. A new test user is registered, logged out and
    # then logged back in again.

    def test_user_registration_and_login_and_logout(self):

        # Find and click the register link in the header
        self.driver.get(self.BASE_URL)
        register_link = self.driver.find_element(
            by=By.ID, value='register-link')
        register_link.click()
        self.assertEqual(self.driver.current_url,
                         f'{self.BASE_URL}accounts/signup/')

        # Find and click the signup link on the login page
        signup_link = self.driver.find_element(by=By.ID, value='register-link')
        signup_link.click()
        self.assertEqual(self.driver.current_url,
                         f'{self.BASE_URL}accounts/signup/')

        # Enter and submit a testing username and password
        username = self.driver.find_element(by=By.NAME, value='username')
        password = self.driver.find_element(by=By.NAME, value='password1')
        password_confirm = self.driver.find_element(
            by=By.NAME, value='password2')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_TEST_USERNAME)
        password.send_keys(settings.SELENIUM_TEST_PASSWORD)
        password_confirm.send_keys(settings.SELENIUM_TEST_PASSWORD)
        submit.click()

        self.assertEqual(self.driver.current_url, self.BASE_URL)

        # Click the logout link
        logout_link = self.driver.find_element(by=By.ID, value="logout-link")
        logout_link.click()
        self.assertEqual(self.driver.current_url,
                         self.BASE_URL + 'accounts/logout/')

        # Confirm logout
        confirm_button = self.driver.find_element(
            by=By.ID, value="confirm-logout")
        confirm_button.click()

        self.assertEqual(self.driver.current_url, self.BASE_URL)

        try:
            login_link = self.driver.find_element(by=By.ID, value="login-link")
            login_exists = True
        except ElementNotVisibleException:
            login_exists = False

        self.assertTrue(login_exists)

        # Try logging in again as test user
        login_link = self.driver.find_element(by=By.ID, value="login-link")
        login_link.click()
        username_field = self.driver.find_element(by=By.NAME, value="login")
        password_field = self.driver.find_element(by=By.NAME, value="password")
        submit_button = self.driver.find_element(by=By.ID, value="submit")
        username_field.send_keys(settings.SELENIUM_TEST_USERNAME)
        password_field.send_keys(settings.SELENIUM_TEST_PASSWORD)
        submit_button.click()

        self.assertEqual(self.driver.current_url, self.BASE_URL)


class TestCreateReviewPage(StaticLiveServerTestCase):

    fixtures = ['db_fixture.json', 'users.json']

    def setUp(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        # necessary for headless
        options.add_argument("--allow-insecure-localhost")
        # due to local port conflict
        options.add_argument("--remote-debugging-port=9221")
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(1)
        self.BASE_URL = self.live_server_url + '/'

    def tearDown(self):
        self.driver.quit()

    def test_previous_reviews_appear_on_page(self):

        # Find and click the signup link on the login page
        self.driver.get(self.BASE_URL)
        signup_link = self.driver.find_element(by=By.ID, value='register-link')
        signup_link.click()

        # Enter and submit a testing username and password
        username = self.driver.find_element(by=By.NAME, value='username')
        password = self.driver.find_element(by=By.NAME, value='password1')
        password_confirm = self.driver.find_element(
            by=By.NAME, value='password2')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_TEST_USERNAME)
        password.send_keys(settings.SELENIUM_TEST_PASSWORD)
        password_confirm.send_keys(settings.SELENIUM_TEST_PASSWORD)
        time.sleep(3)
        submit.click()

        # Once logged in, navigate to the review page
        self.driver.get(self.BASE_URL + 'create_review/2/bolg')
        self.assertTrue(self.driver.find_elements(
            by=By.CLASS_NAME, value='existing-comment'))
        self.assertTrue(self.driver.find_elements(
            by=By.CLASS_NAME, value='existing-rating'))
        self.assertTrue(self.driver.find_elements(
            by=By.CLASS_NAME, value='existing-reviewer'))

        sample_comment = "A random comment"

        # Retrieve the reviewer and drumloop ids from the form
        reviewer = self.driver.find_element(
            by=By.NAME, value='reviewer').get_attribute('value')
        drumloop = self.driver.find_element(
            by=By.NAME, value='drumloop').get_attribute('value')

        form_comment_input = self.driver.find_element(
            by=By.NAME, value='comment')
        form_rating_input = self.driver.find_elements(
            by=By.NAME, value='rating')
        submit_button = self.driver.find_element(by=By.ID, value="submit")

        form_comment_input.send_keys(sample_comment)
        self.driver.execute_script(
            'document.getElementsByName("rating")[0].setAttribute("value", "5")', form_rating_input)
        submit_button.click()
        ratings = Review.objects.all().filter(
            drumloop=drumloop,
            comment=sample_comment,
            rating=5)
        self.assertTrue(ratings)


''' A number of these tests are simplified by the assumption that the tracks
    in the track-holder div are ordered by id ascending, and will break if
    this ordering is altered.
'''


class TestLoopEditorPage(StaticLiveServerTestCase):

    fixtures = ['db_fixture.json', 'users.json']

    def setUp(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless")
        # necessary for headless
        options.add_argument("--allow-insecure-localhost")
        # due to local port conflict
        options.add_argument("--remote-debugging-port=9221")
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        self.driver.implicitly_wait(1)
        self.BASE_URL = self.live_server_url + '/'

        

    def tearDown(self):
        self.driver.quit()

    def test_name_and_tempo_change_reflected_in_db(self):
        drumloop_id = 2
        self.driver.get(self.BASE_URL + f'editor/{drumloop_id}')

        # Set the displayInstructions cookie to false - this testing suite
        # does not test the instruction tooltip modals.
        self.driver.add_cookie({'name': 'displayInstructions', 'value': 'false'})

        # login as user who created fixture.
        username = self.driver.find_element(by=By.NAME, value='login')
        password = self.driver.find_element(by=By.NAME, value='password')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_FIXTURE_USERNAME)
        password.send_keys(settings.SELENIUM_FIXTURE_PASSWORD)
        submit.click()
        time.sleep(1)

        name_input = self.driver.find_elements(By.NAME, 'drumloop_name')
        tempo_input = self.driver.find_elements(By.NAME, 'tempo')
        save_button = self.driver.find_elements(By.ID, 'save-data')
        self.assertTrue(name_input)
        self.assertTrue(tempo_input)
        self.assertTrue(save_button)

        script = 'document.getElementById("tempo").setAttribute("value", "61");'
        self.driver.execute_script(script)

        # The post request is sent from LoopPlayer.js, whose tempo value is
        # only set when the input event fires. This would not be required if
        # the element was part of a form, as the altered value would be
        # automatically POSTed.
        script = 'document.getElementById("tempo").dispatchEvent(new Event("input", {"bubbles": true}));'
        self.driver.execute_script(script)
        tempo_input[0].send_keys(Keys.ENTER)
        script = 'document.getElementById("drumloop_name").setAttribute("value", "");'
        self.driver.execute_script(script)
        name_input[0].send_keys('New name')

        script = "document.getElementById('save-data').scrollIntoView(true);"
        self.driver.execute_script(script)

        time.sleep(1)  # wait for scroll
        save_button[0].click()

        time.sleep(1)
        loop = Drumloop.objects.get(id=drumloop_id)
        self.assertEqual(loop.name, 'New name')
        self.assertEqual(loop.tempo, 61)

    def test_delete_track_button_and_confirm_modal(self):

        drumloop_id = 2
        track_count = len(Track.objects.filter(drumloop=drumloop_id))

        # Check confirm modal opens when delete track button pressed
        self.driver.get(self.BASE_URL + f'editor/{drumloop_id}')

        # Set the displayInstructions cookie to false - this testing suite
        # does not test the instruction tooltip modals.
        self.driver.add_cookie({'name': 'displayInstructions', 'value': 'false'})

        # login as user who created fixture.
        username = self.driver.find_element(by=By.NAME, value='login')
        password = self.driver.find_element(by=By.NAME, value='password')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_FIXTURE_USERNAME)
        password.send_keys(settings.SELENIUM_FIXTURE_PASSWORD)
        submit.click()
        time.sleep(1)

        track_holders = self.driver.find_elements(
            By.CLASS_NAME, 'track-holder-row')
        first_track_holder = track_holders[0]
        delete_buttons = self.driver.find_elements(
            By.CLASS_NAME, 'delete-track-button')
        first_del_button = delete_buttons[0]
        first_del_button.click()
        time.sleep(1)

        delete_confirm_modal = self.driver.find_elements(
            By.ID, 'delete-track-confirmation')
        classList = delete_confirm_modal[0].get_attribute('class').split(" ")
        self.assertTrue('in' in classList or 'show' in classList)

        # Check confirmation refusal hides modal and track remains.
        refuse_button = self.driver.find_element(
            By.ID, 'refuse-delete-track-button')
        refuse_button.click()
        time.sleep(1)
        self.assertFalse('in' in classList and 'show' in classList)
        track_holders = self.driver.find_elements(
            By.CLASS_NAME, 'track-holder-row')
        self.assertTrue(first_track_holder in track_holders)

        # Click the delete button again and confirm this time
        first_del_button.click()
        time.sleep(1)
        confirm_button = self.driver.find_element(
            By.ID, 'confirm-delete-track-button')
        confirm_button.click()
        time.sleep(1)
        track_holders = self.driver.find_elements(
            By.CLASS_NAME, 'track-holder-row')
        self.assertFalse(first_track_holder in track_holders)

        # Confirm that the track has been removed from the database.
        track_count = len(Track.objects.filter(drumloop=drumloop_id))
        self.assertEqual(track_count, len(track_holders))

    def test_add_new_track_button_and_selection_modal(self):

        # Store the current number of tracks, and click the new track button
        drumloop_id = 2
        self.driver.get(self.BASE_URL + f'editor/{drumloop_id}')

        # Set the displayInstructions cookie to false - this testing suite
        # does not test the instruction tooltip modals.
        self.driver.add_cookie({'name': 'displayInstructions', 'value': 'false'})

        # login as user who created fixture.
        username = self.driver.find_element(by=By.NAME, value='login')
        password = self.driver.find_element(by=By.NAME, value='password')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_FIXTURE_USERNAME)
        password.send_keys(settings.SELENIUM_FIXTURE_PASSWORD)
        submit.click()
        time.sleep(1)

        new_track_button = self.driver.find_element(By.ID, 'add-new-track')
        track_holders = self.driver.find_elements(
            By.CLASS_NAME, 'track-holder-row')
        track_count = len(track_holders)
        script = "document.getElementById('add-new-track').scrollIntoView(true);"
        self.driver.execute_script(script)
        time.sleep(1)
        new_track_button.click()
        time.sleep(3)

        # Check that instrument chooser modal is shown.
        modal = self.driver.find_element(By.ID, 'instrument-chooser')
        class_list = modal.get_attribute('class').split(" ")
        self.assertTrue('in' in class_list or 'show' in class_list)

        # Select the first instrument, store the name, and click confirm
        first_instrument = self.driver.find_elements(
            By.CLASS_NAME, 'instrument-spans')[0]
        chosen_instrument_name = first_instrument.get_attribute('innerText')
        confirm_button = self.driver.find_element(By.ID, 'save-new-instrument')
        confirm_button.click()
        time.sleep(1)

        # Check the updated track display to ensure the last track (tracks are
        # ordered by primary key) instrument name matches the chosen instrument
        # name.
        track_inst_names = self.driver.find_elements(
            By.CLASS_NAME, 'inst-test')
        track_holders = self.driver.find_elements(
            By.CLASS_NAME, 'track-holder-row')
        new_track_count = len(track_holders)
        self.assertEqual(track_count + 1, new_track_count)
        new_inst = track_inst_names[-1].get_attribute('innerText')
        self.assertEqual(chosen_instrument_name, new_inst)

        # Check that a new track has been added to the database.
        db_track_count = len(Track.objects.filter(drumloop=drumloop_id))
        self.assertEqual(db_track_count, new_track_count)

    def test_toggle_beat_and_save_to_db(self):
        drumloop_id = 2
        self.driver.get(self.BASE_URL + f'editor/{drumloop_id}')

        # Set the displayInstructions cookie to false - this testing suite
        # does not test the instruction tooltip modals.
        self.driver.add_cookie({'name': 'displayInstructions', 'value': 'false'})

        # login as user who created fixture.
        username = self.driver.find_element(by=By.NAME, value='login')
        password = self.driver.find_element(by=By.NAME, value='password')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_FIXTURE_USERNAME)
        password.send_keys(settings.SELENIUM_FIXTURE_PASSWORD)
        submit.click()
        time.sleep(1)

        # Get a ref to the first track's beats-holder, and click on each child
        # beat to ensure it toggles the active_beat class.
        initial_values = []
        beats_1 = self.driver.find_elements(By.CLASS_NAME, 'beats-holder')[0]
        beat_element_list = beats_1.find_elements(By.XPATH, './child::*')
        for elem in beat_element_list:
            initially_active = 'active_beat' in elem.get_attribute(
                'class').split(" ")
            initial_values.append('8' if initially_active else '0')
            elem.click()
            if (initially_active):
                self.assertTrue(
                    'active_beat' not in elem.get_attribute('class').split(" "))
            else:
                self.assertTrue(
                    'active_beat' in elem.get_attribute('class').split(" "))
            elem.click()
            self.assertEqual(
                initially_active, 'active_beat' in elem.get_attribute('class')
                                                       .split(" "))
        initial_beat_string = ''.join(initial_values)

        # Flip each character in the initial_beat_string, and click each beat
        # div once to toggle each one. Save the drumloop and compare the beat
        # string to the record in the db.
        new_beat_string = ''.join(
            ['8' if char == '0' else '0' for char in initial_beat_string])
        for elem in beat_element_list:
            elem.click()
        save_button = self.driver.find_element(By.ID, 'save-data')
        script = "document.getElementById('save-data').scrollIntoView(true);"
        self.driver.execute_script(script)
        time.sleep(1)  # allow time to scroll
        save_button.click()
        time.sleep(1)  # allow time for post request
        tracks = Track.objects.filter(drumloop=drumloop_id).order_by('id')
        self.assertEqual(tracks[0].beats, new_beat_string)
