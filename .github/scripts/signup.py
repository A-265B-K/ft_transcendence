from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    page = p.chromium.launch().new_page(ignore_https_errors=True)

    page.goto("https://localhost:8443/signup")
    page.get_by_placeholder("Username", exact=True).fill("ci-user")
    page.get_by_placeholder("Email", exact=True).fill("ci@example.test")
    page.get_by_placeholder("Password", exact=True).fill("Test123!")
    page.get_by_placeholder("Confirm password", exact=True).fill("Test123!")

    page.get_by_role("checkbox").nth(0).check()
    page.get_by_role("checkbox").nth(1).check()

    with page.expect_response("https://localhost:8443/api/auth/register") as registration:
        page.get_by_role("button", name="Create account", exact=True).click()

    assert registration.value.ok, "Registration failed"
