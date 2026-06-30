const params =
new URLSearchParams(window.location.search);

const id = params.get("id");

async function loadAppointment(){

    const response =
    await fetch(
        `http://localhost:3000/api/appointments/${id}`
    );

    const data =
    await response.json();

    const appointment =
    data.appointment;

    document.getElementById("name").value =
        appointment.name || "";

    document.getElementById("address").value =
        appointment.address || "";

    document.getElementById("phone").value =
        appointment.phone || "";

    document.getElementById("age").value =
        appointment.age || "";

    document.getElementById("gender").value =
        appointment.gender || "";

    document.getElementById("date").value =
        appointment.dateChoose || "";

    document.getElementById("time").value =
        appointment.timeChoose || "";

    document.getElementById("call").value =
        appointment.call || "";

    document.getElementById("confirm").value =
        appointment.confirm || "";

}

async function updateAppointment(){

    const response =
    await fetch(
        `http://localhost:3000/api/appointments/${id}`,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                name:
                document.getElementById("name").value,

                address:
                document.getElementById("address").value,

                phone:
                document.getElementById("phone").value,

                age:
                document.getElementById("age").value,

                gender:
                document.getElementById("gender").value,

                dateChoose:
                document.getElementById("date").value,

                timeChoose:
                document.getElementById("time").value,

                call:
                document.getElementById("call").value,

                confirm:
                document.getElementById("confirm").value
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);

}

async function deleteAppointment(){

    if(
        !confirm(
            "Delete this appointment?"
        )
    ) return;

    const response =
    await fetch(
        `http://localhost:3000/api/appointments/${id}`,
        {
            method:"DELETE"
        }
    );

    const data =
    await response.json();

    alert(data.message);

    window.location.href =
        "dashboard.html";

}

function goBack(){

    window.location.href =
        "dashboard.html";

}

loadAppointment();