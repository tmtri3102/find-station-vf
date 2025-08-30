document.addEventListener("DOMContentLoaded", () => {
  let stations = [];
  const findButton = document.getElementById("findButton");
  const resultDiv = document.getElementById("result");

  const vehicleOptions = document.querySelectorAll('input[name="vehicleType"]');

  vehicleOptions.forEach((option) => {
    option.addEventListener("change", () => {
      if (findButton.hidden) {
        findButton.hidden = false;
      }
    });
  });

  fetch("stations.json")
    .then((res) => {
      if (!res.ok) throw new Error("Không thể tải dữ liệu trạm sạc.");
      return res.json();
    })
    .then((data) => {
      stations = data;
    })
    .catch((err) => {
      findButton.disabled = true;
      findButton.classList.add("disabled");
      console.error("Lỗi tải dữ liệu:", err);
    });

  findButton.addEventListener("click", () => {
    resultDiv.hidden = false;

    if (!navigator.geolocation) {
      resultDiv.innerHTML =
        '<span class="result-placeholder" style="color:#ef4444">Trình duyệt của bạn không hỗ trợ định vị.</span>';
      return;
    }
    if (!stations.length) {
      resultDiv.innerHTML =
        '<span class="result-placeholder" style="color:#f59e42">Dữ liệu trạm sạc chưa sẵn sàng.</span>';
      return;
    }

    resultDiv.innerHTML = '<div class="loader"></div>';

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });

  function success(position) {
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    const vehicleType = document.querySelector(
      'input[name="vehicleType"]:checked'
    ).value;
    const relevantStations = stations.filter(
      (station) => station.type === vehicleType || station.type === "both"
    );
    if (relevantStations.length === 0) {
      resultDiv.innerHTML = `<span class="result-placeholder" style="color:#f59e42">Không tìm thấy trạm sạc nào phù hợp với loại xe đã chọn.</span>`;
      return;
    }
    let closestStation = null;
    let minDistance = Infinity;
    relevantStations.forEach((station) => {
      const distance = haversineDistance(
        userLat,
        userLon,
        station.lat,
        station.lon
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestStation = station;
      }
    });
    if (closestStation) {
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${closestStation.lat},${closestStation.lon}`;
      resultDiv.innerHTML = `
        <a href="${mapsUrl}" target="_blank" class="result-content-link">
          <div class="result-header">
            <img src="https://www.gstatic.com/images/branding/product/2x/maps_64dp.png" alt="Google Maps icon" class="maps-icon">
            <div class="result-info">
              <p class="station-address">${closestStation.address}</p>
              <p class="directions-text">Bấm để chỉ đường</p>
            </div>
          </div>
          <div class="station-details">
            <p class="station-distance">${minDistance.toFixed(2)} km</p>
          </div>
        </a>
      `;
    } else {
      resultDiv.innerHTML =
        '<span class="result-placeholder" style="color:#ef4444">Không tìm thấy trạm sạc nào.</span>';
    }
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    resultDiv.innerHTML =
      '<span class="result-placeholder" style="color:#ef4444">Không thể lấy vị trí. Vui lòng cấp quyền truy cập vị trí và thử lại.</span>';
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
});
