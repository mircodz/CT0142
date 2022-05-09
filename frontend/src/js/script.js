document.getElementById("password").addEventListener("click", () => {
    document.getElementById("password-help").classList.remove("d-none");
    document.getElementById("password-strength-bar").classList.remove("d-none");
});

const testPasswRegexp = (passw, regexp) => {
    return regexp.test(passw);
};

const testPassw = passw => {

    let strength = 'none';

    const moderate = /(?=.*[A-Z])(?=.*[a-z]).{5,}|(?=.*[\d])(?=.*[a-z]).{5,}|(?=.*[\d])(?=.*[A-Z])(?=.*[a-z]).{5,}/g;
    const strong = /(?=.*[A-Z])(?=.*[a-z])(?=.*[\d]).{7,}|(?=.*[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=.*[\d]).{7,}/g;
    const extraStrong = /(?=.*[A-Z])(?=.*[a-z])(?=.*[\d])(?=.*[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]).{9,}/g;

    if (testPasswRegexp(passw, extraStrong)) {
        strength = 'extra';
    } else if (testPasswRegexp(passw, strong)) {
        strength = 'strong';
    } else if (testPasswRegexp(passw, moderate)) {
        strength = 'moderate';
    } else if (passw.length > 0) {
        strength = 'weak';
    }
    return strength;
};

const testPasswError = passw => {
    const errorSymbols = /\s/g;
    return testPasswRegexp(passw, errorSymbols);
};

const setStrengthBarValue = (bar, strength) => {

    let strengthValue;

    switch (strength) {
        case 'weak':
            strengthValue = 25;
            bar.setAttribute('aria-valuenow', strengthValue);
            break;

        case 'moderate':
            strengthValue = 50;
            bar.setAttribute('aria-valuenow', strengthValue);
            break;

        case 'strong':
            strengthValue = 75;
            bar.setAttribute('aria-valuenow', strengthValue);
            break;

        case 'extra':
            strengthValue = 100;
            bar.setAttribute('aria-valuenow', strengthValue);
            break;

        default:
            strengthValue = 0;
            bar.setAttribute('aria-valuenow', 0);
    }

    return strengthValue;

};

//also adds a text label based on styles
const setStrengthBarStyles = (bar, strengthValue) => {

    bar.style.width = `${strengthValue}%`;

    bar.classList.remove('bg-success', 'bg-info', 'bg-warning');

    switch (strengthValue) {
        case 25:
            bar.classList.add('bg-danger');
            bar.textContent = 'Weak';
            break;
        case 50:
            bar.classList.remove('bg-danger');
            bar.classList.add('bg-warning');
            bar.textContent = 'Moderate';
            break;
        case 75:
            bar.classList.remove('bg-danger');
            bar.classList.add('bg-info');
            bar.textContent = 'Strong';
            break;
        case 100:
            bar.classList.remove('bg-danger');
            bar.classList.add('bg-success');
            bar.textContent = 'Extra Strong';
            break;
        default:
            bar.classList.add('bg-danger');
            bar.textContent = '';
            bar.style.width = `0`;
    }
};

const setStrengthBar = (bar, strength) => {

    //setting value
    const strengthValue = setStrengthBarValue(bar, strength);

    //setting styles
    setStrengthBarStyles(bar, strengthValue);
};

const passwordStrength = (input, strengthBar) => {

    //getting password
    let passw = document.getElementById("password").value;

    const strength = testPassw(passw);

    //setting strength bar (value and styles)
    setStrengthBar(strengthBar, strength);
};

const passwVisibilitySwitcher = (passwField, visibilityToggler) => {

    const visibilityStatus = passwordVisible(passwField);

    changeVisibiltyBtnIcon(visibilityToggler, visibilityStatus);
}

document.getElementById("password").addEventListener("input", () => {
    passwordStrength(this, document.getElementById("strength-bar"));
});

const toggle = document.querySelector(".toggle");
const input = document.querySelector("#password");

toggle.addEventListener("click", () => {
    if (input.type === "password") {
        input.type = "text";
        toggle.classList.replace("bi-eye-slash-fill", "bi-eye-fill");
    } else {
        input.type = "password";
        toggle.classList.replace("bi-eye-fill", "bi-eye-slash-fill");
    }
})