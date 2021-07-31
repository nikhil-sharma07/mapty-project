'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}


class Running extends Workout {
    type = 'running';

    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }


    calcPace() {
        this.pace = (this.duration) / (this.distance);
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed() {
        this.speed = (this.distance) / (this.duration / 60);
    }
}



class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    constructor() {
        this.__getPosition();

        this.__getLocalStorage();


        form.addEventListener("submit", this.__newWorkout.bind(this));
        inputType.addEventListener('change', this.__toggleElevationField);
        containerWorkouts.addEventListener('click', this.__moveToPopup.bind(this
        ));
    }

    __getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this.__loadMap.bind(this), function () {
                alert("could not load page");
            });
    }

    __loadMap(x) {
        const latitude = x.coords.latitude;
        const longitude = x.coords.longitude;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);



        this.#map.on('click', this.__showForm.bind(this), function () {
            console.log('Not able to fetch location!!');
        });

        this.#workouts.forEach((workout) => {
            this._renderWorkoutMarkup(workout);

        })
    }


    __showForm(e) {
        this.#mapEvent = e;
        form.classList.remove('hidden');
        inputDistance.focus();
    }


    __hideForm() {
        inputDistance.value = inputElevation.value = inputCadence.value = inputDuration.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000);
    }

    __toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    __newWorkout(e) {
        e.preventDefault();

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        if (type == 'running') {
            const cadence = +inputCadence.value;
            console.log(inputCadence.value);
            if (!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence))
                return alert('INPUTS MUST BE POSITIVE NUMBERS');


            if (distance < 0 || duration < 0 || cadence < 0) {
                return alert('INPUTS MUST BE POSITIVE NUMBERS');
            }

            workout = new Running([lat, lng], distance, duration, cadence);

        }

        if (type == 'cycling') {
            const elevation = +inputElevation.value;
            if (!Number.isFinite(distance) || !Number.isFinite(duration))
                return alert('INPUTS MUST BE POSITIVE NUMBERS');

            if (distance < 0 || duration < 0) {
                return alert('INPUTS MUST BE POSITIVE NUMBERS');
            }

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);
        this._renderWorkoutMarkup(workout);
        this._renderWorkout(workout);
        this.__hideForm();
        this.__setLocalStorage();

    }


    _renderWorkoutMarkup(workout) {
        const popupObj = {
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }

        L.marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup(popupObj))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

        console.log(workout);
    }


    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if (workout.type === 'running') {
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;
        }

        if (workout.type === 'cycling') {
            html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
        }

        form.insertAdjacentHTML('afterend', html);

    }

    __moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });

    }

    __setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    __getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        if (!data) return;
        this.#workouts = data;
        this.#workouts.forEach((workout) => {
            this._renderWorkout(workout);

        })
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }


}




const app = new App();










