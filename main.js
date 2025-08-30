document.addEventListener("DOMContentLoaded", () => {
  let stations = [];
  const findButtonContainer = document.getElementById("findButton");
  const findButton = findButtonContainer.querySelector(".find-btn");
  const resultDiv = document.getElementById("result");

  // Always hide resultDiv on load using display:none
  resultDiv.style.display = "none";

  const vehicleOptions = document.querySelectorAll('input[name="vehicleType"]');

  vehicleOptions.forEach((option) => {
    option.addEventListener("change", () => {
      if (findButtonContainer.hidden) {
        findButtonContainer.hidden = false;
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
    resultDiv.style.display = "";
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
        <div class="result-content">
          <div class="result-label" style="text-align:center; font-weight:500; margin-bottom:8px;">Trạm gần nhất:</div>
          <div class="station-address truncate-2" title="${
            closestStation.address
          }">${closestStation.address}</div>
          <button class="open-maps-btn" style="margin:16px auto 0 auto; display:block;" data-url="${mapsUrl}">
            3. Mở trên Google Maps (${minDistance.toFixed(2)} km)
          </button>
        </div>
      `;
      const openBtn = resultDiv.querySelector(".open-maps-btn");
      openBtn.addEventListener("click", () => {
        window.open(openBtn.getAttribute("data-url"), "_blank");
      });
    } else {
      resultDiv.innerHTML =
        '<span class="error">Không tìm thấy trạm sạc nào.</span>';
    }
  }

  function error(err) {
    console.warn(`ERROR(${err.code}): ${err.message}`);
    resultDiv.innerHTML =
      '<span class="error">Không thể tìm trạm sạc. <br/> Vui lòng bấm cấp quyền truy cập vị trí và thử lại.</span>';
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
