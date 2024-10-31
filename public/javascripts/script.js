
function confirmDelete() {


    if (confirm('Are you sure you want to delete your account?')) {
        window.location.href = "/delete";
        alert('Account deleted.');
    } else {
        alert('Account deletion canceled.');
    }
}