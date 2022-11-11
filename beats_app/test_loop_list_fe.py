import time
from django.test import LiveServerTestCase
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.db import connection
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.wait import WebDriverWait



class TestLoopListFrontEnd(LiveServerTestCase):

    def setUp(self):
        options = webdriver.FirefoxOptions()
        options.add_argument("start_maximized")
        self.driver = webdriver.Firefox(options=options)
        self.driver.implicitly_wait(10)
        self.BASE_URL = self.live_server_url + '/'

    def tearDown(self):
        self.driver.quit()

    def test_create_new_loop_button(self):
        self.driver.get(self.BASE_URL)
        create_new_loop_button = self.driver.find_element(by=By.ID, value='create-new-loop-button')
        create_new_loop_button.click()
        self.assertEqual(self.driver.current_url, self.BASE_URL + 'create_new_loop/')

    def test_all_play_buttons_show_and_hide_current_track_display(self):
        self.driver.get(self.BASE_URL)
        play_buttons = self.driver.find_elements(by=By.CLASS_NAME, value="play-button")
        current_track_display = self.driver.find_element(by=By.ID, value="current-track-display")

        for button in play_buttons:
            button.click()
            #WebDriverWait(self.driver, 10).until(EC.ele(By.CLASS_NAME, 'play-button'))
            time.sleep(1)
            self.assertNotIn('invisible', current_track_display.get_attribute('class').split())
            
            button.click()
            time.sleep(1)
            #WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable(By.CLASS_NAME, 'play-button'))
            self.assertIn('invisible', current_track_display.get_attribute('class').split())
        
    # These tests test the login, logout and register functionality of the
    # base.html template. A new test user is registered, logged out and 
    # then logged back in again.

    def test_user_registration_and_login_and_logout(self):

        # Find and click the register link in the header
        self.driver.get(self.BASE_URL)
        register_link = self.driver.find_element(by=By.ID, value='register-link')
        register_link.click()
        self.assertEqual(self.driver.current_url, f'{self.BASE_URL}accounts/login/')

        # Find and click the signup link on the login page
        signup_link = self.driver.find_element(by=By.ID, value='signup-link')
        signup_link.click()
        self.assertEqual(self.driver.current_url, f'{self.BASE_URL}accounts/signup/')

        # Enter and submit a testing username and password
        username = self.driver.find_element(by=By.NAME, value='username')
        password = self.driver.find_element(by=By.NAME, value='password1')
        password_confirm = self.driver.find_element(by=By.NAME, value='password2')
        submit = self.driver.find_element(by=By.ID, value="submit")
        username.send_keys(settings.SELENIUM_TEST_USERNAME)
        password.send_keys(settings.SELENIUM_TEST_PASSWORD)
        password_confirm.send_keys(settings.SELENIUM_TEST_PASSWORD)
        submit.click()

        self.assertEqual(self.driver.current_url, self.BASE_URL)


        # Click the logout link
        logout_link = self.driver.find_element(by=By.ID, value="logout-link")
        logout_link.click()
        self.assertEqual(self.driver.current_url, self.BASE_URL + 'accounts/logout/')

        # Confirm logout
        confirm_button = self.driver.find_element(by=By.ID, value="confirm-logout")
        confirm_button.click()

        self.assertEqual(self.driver.current_url, self.BASE_URL)

        try:
            login_link = self.driver.find_element(by=By.ID, value="login-link")
            login_exists = True
            print('login exists')
        except:
            login_exists = False
            print('logout does not exist')

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

        

        






