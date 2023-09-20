$(document).ready(function () {
    const $modal = $('#questionsModal');
    const $closeModalButton = $('#closeQuestionsButton');
    function closeModal1() {
        $modal.fadeOut();
        $('body').css('overflow', 'auto');
    }
    $closeModalButton.on('click', closeModal1);

})