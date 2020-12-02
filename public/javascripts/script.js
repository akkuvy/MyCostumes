function addtoCart(proId) {
  $.ajax({
    url: "/addto-cart/" + proId,
    method: "get",
    success: (response) => {
      let count = $("#cart-count").html();
      if (response.status) {
        count = parseInt(count) + 1;
        $("#cart-count").html(count);

        alert("Item added successfully");
      }
    },
  });
}
