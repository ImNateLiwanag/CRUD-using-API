const API_URL = "https://dummyjson.com/users";

let students = [];
let editingStudentId = null;

const form = document.getElementById("studentForm");
const studentIdInput = document.getElementById("studentId");
const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const ageInput = document.getElementById("age");

const tableBody = document.getElementById("studentTableBody");
const statusMessage = document.getElementById("statusMessage");
const loading = document.getElementById("loading");

const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

function showLoading(message = "Processing request...") {
    loading.textContent = message;
    loading.classList.remove("hidden");
}

function hideLoading() {
    loading.classList.add("hidden");
}

function showStatus(message, type = "success") {
    statusMessage.textContent = message;
    statusMessage.className = `status ${type}`;

    setTimeout(() => {
        statusMessage.classList.add("hidden");
    }, 3500);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderStudents() {
    if (students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">No student records found.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = students.map(student => `
        <tr>
            <td>#${escapeHtml(student.id)}</td>
            <td>${escapeHtml(student.firstName)} ${escapeHtml(student.lastName)}</td>
            <td>${escapeHtml(student.email)}</td>
            <td>${escapeHtml(student.age)}</td>
            <td>
                <div class="actions">
                    <button class="btn secondary small" onclick="startEdit(${student.id})">
                        Edit
                    </button>
                    <button class="btn danger small" onclick="deleteStudent(${student.id})">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function resetForm() {
    form.reset();
    studentIdInput.value = "";
    editingStudentId = null;
    formTitle.textContent = "Add Student";
    submitButton.textContent = "Add Student";
    cancelButton.classList.add("hidden");
}

function getFormData() {
    return {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        age: Number(ageInput.value)
    };
}

async function getStudents() {
    try {
        showLoading("Loading students with GET...");

        const response = await fetch(`${API_URL}?limit=8`);

        if (!response.ok) {
            throw new Error(`GET request failed: ${response.status}`);
        }

        const data = await response.json();

        students = data.users;
        renderStudents();

        showStatus("Students loaded successfully using GET.", "success");
    } catch (error) {
        console.error(error);
        showStatus(`Error: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

async function addStudent(studentData) {
    try {
        showLoading("Adding student...");

        const response = await fetch(`${API_URL}/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error(`POST request failed: ${response.status}`);
        }

        const apiStudent = await response.json();

        let newId = 101;

        while (
            students.some(student =>
                Number(student.id) === newId
            )
        ) {
            newId++;
        }

        const newStudent = {
            ...apiStudent,
            id: newId
        };

        students.unshift(newStudent);

        renderStudents();

        showStatus(
            `Student #${newStudent.id} added successfully.`,
            "success"
        );

        resetForm();

    } catch (error) {

        console.error(error);

        showStatus(
            `Error: ${error.message}`,
            "error"
        );

    } finally {

        hideLoading();
    }
}

async function updateStudent(id, studentData) {
    try {
        showLoading("Updating student with PUT...");

        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        });

        if (!response.ok) {
            throw new Error(`PUT request failed: ${response.status}`);
        }

        const updatedStudent = await response.json();

        students = students.map(student =>
            Number(student.id) === Number(id)
                ? { ...student, ...updatedStudent }
                : student
        );

        renderStudents();

        showStatus(`Student #${id} updated successfully using PUT.`, "success");
        resetForm();
    } catch (error) {
        console.error(error);
        showStatus(`Error: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

async function deleteStudent(id) {
    const confirmed = confirm(`Delete student #${id}?`);

    if (!confirmed) {
        return;
    }

    try {
        showLoading("Deleting student with DELETE...");

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error(`DELETE request failed: ${response.status}`);
        }

        const deletedStudent = await response.json();

        if (!deletedStudent.isDeleted) {
            throw new Error("The API did not confirm the deletion.");
        }

        students = students.filter(student =>
            Number(student.id) !== Number(id)
        );

        renderStudents();

        showStatus(`Student #${id} deleted successfully using DELETE.`, "success");
    } catch (error) {
        console.error(error);
        showStatus(`Error: ${error.message}`, "error");
    } finally {
        hideLoading();
    }
}

function startEdit(id) {
    const student = students.find(item => Number(item.id) === Number(id));

    if (!student) {
        showStatus("Student record could not be found.", "error");
        return;
    }

    editingStudentId = id;

    studentIdInput.value = student.id;
    firstNameInput.value = student.firstName || "";
    lastNameInput.value = student.lastName || "";
    emailInput.value = student.email || "";
    ageInput.value = student.age || "";

    formTitle.textContent = `Edit Student #${id}`;
    submitButton.textContent = "Update Student";
    cancelButton.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const studentData = getFormData();

    if (
        !studentData.firstName ||
        !studentData.lastName ||
        !studentData.email ||
        !studentData.age
    ) {
        showStatus("Please complete all fields.", "error");
        return;
    }

    if (editingStudentId !== null) {
        await updateStudent(editingStudentId, studentData);
    } else {
        await addStudent(studentData);
    }
});

cancelButton.addEventListener("click", resetForm);

getStudents();
