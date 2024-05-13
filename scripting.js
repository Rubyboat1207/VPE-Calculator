///<reference path="./jquery.js" />

var vecInputReference = null;
const mapRange = (value, [srcMin, srcMax], [dstMin, dstMax]) =>
  ((value - srcMin) / (srcMax - srcMin)) * (dstMax - dstMin) + dstMin;
const findMinMax = (valueArr) => {
  if (valueArr.length === 0) {
    return { min: undefined, max: undefined };
  }

  let min = valueArr[0];
  let max = valueArr[0];

  for (let i = 1; i < valueArr.length; i++) {
    if (valueArr[i] < min) {
      min = valueArr[i];
    }
    if (valueArr[i] > max) {
      max = valueArr[i];
    }
  }

  return { min, max };
};

function add() {
  const clone = vecInputReference.clone();

  resetClone(clone);
  $("#inputs").append(clone);
  $("#add").appendTo("#inputs");
}

function resetClone(clone) {
  clone.attr("id", `vectors-${$("inputs").children().length}`);
  clone.children().eq(1).prop("checked", false);
  clone.children().eq(3).val("");
  clone.children().eq(5).val("");
}

function onChange(el) {
  const checked = $(el).prop("checked");
  $(el.parentElement)
    .children()
    .eq(2)
    .text(checked ? "X" : "Theta Degrees");
  $(el.parentElement)
    .children()
    .eq(4)
    .text(checked ? "Y" : "Magnitude");
  render();
}

function remove(btn_element) {
  let i = 1;
  for (const child of $("#input").children()) {
    if (child.id != btn_element.parentElement.id) {
      child.setAttribute("id", i);
    }
  }
  btn_element.parentElement.parentElement.remove();

  render();
}

function onLoad() {
  vecInputReference = $("#vectors-1").clone();
  $("#vectors-1").children(".button-container").eq(0).remove();

  function resizeCanvas() {
    var canvas = $("#display");
    var container = canvas.parent();

    // Set the canvas dimensions to match the container
    canvas.attr("width", container.width());
    canvas.attr("height", container.height());

    // Your drawing code here
    // Remember to redraw your canvas here as resizing clears it
  }

  // Resize the canvas to fit its container initially and on window resize
  resizeCanvas();
  $(window).on("resize", resizeCanvas);

  resetClone($("#vectors-1"));

  render();

  onChange();
}

function render() {
  /**
   * @type {HTMLCanvasElement}
   */
  const canvas = $("#display").eq(0).get()[0];

  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const all_component_values = $(".vector")
    .get()
    .map((el) => {
      const isComponent = $(el.children[1]).is(":checked");

      const a = parseFloat(el.children[3].value);
      const b = parseFloat(el.children[5].value);

      if (isNaN(a) || isNaN(b)) {
        return { x: 0, y: 0 };
      }

      if (isComponent) {
        return { x: a, y: b };
      } else {
        return {
          x: Math.cos(a * (Math.PI / 180)) * b,
          y: Math.sin(a * (Math.PI / 180)) * b,
        };
      }
    });
  console.log(all_component_values);

  let x_magnitude = 0;
  let y_magnitude = 0;

  all_component_values.forEach((v) => {
    x_magnitude += v.x;
    y_magnitude += v.y;
  });

  let max = Math.max(Math.abs(x_magnitude), Math.abs(y_magnitude));

  const minmax_x = {
    min: -max,
    max: max,
  };
  const minmax_y = {
    min: -max,
    max: max,
  };

  const toScreenCoords = (val) => ({
    x:
      mapRange(
        val.x,
        [Math.min(minmax_x.min, -10) - 5, Math.max(minmax_x.max, 10) + 5],
        [-canvas.width / 2, canvas.width / 2]
      ) +
      canvas.width / 2,
    y:
      canvas.height -
      (mapRange(
        val.y,
        [Math.min(minmax_y.min, -10) - 5, Math.max(minmax_y.max, 10) + 5],
        [-canvas.height / 2, canvas.height / 2]
      ) +
        canvas.height / 2),
  });

  ctx.moveTo(canvas.width / 2, canvas.height / 2);

  const pv = { x: 0, y: 0 };

  for (const vector of all_component_values) {
    console.log("vec", vector);
    const screenCoords = toScreenCoords({
      x: vector.x + pv.x,
      y: vector.y + pv.y,
    });

    // Start drawing from the previous coordinates
    const prev = toScreenCoords(pv);
    ctx.beginPath();
    ctx.arc(prev.x, prev.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();


    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    
    // Draw a line to the new coordinates
    ctx.lineTo(screenCoords.x, screenCoords.y);

    // Set the style
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.stroke();

    // Update prev to the new coordinates for the next iteration
    pv.x += vector.x;
    pv.y += vector.y;
  }

  ctx.beginPath();
  ctx.arc(toScreenCoords(pv).x, toScreenCoords(pv).y, 4, 0, Math.PI * 2);
  ctx.fillStyle = "black";
  ctx.fill();

  $("#x").text(pv.x + "");
  $("#y").text(pv.y + "");
  $("#theta").text(Math.atan2(pv.y, pv.x).toFixed(2) + "");
  $("#mag").text(Math.sqrt(pv.x * pv.x + pv.y * pv.y).toFixed(2) + "");

  if (
    all_component_values.length == 2 &&
    pv.x == all_component_values[0].x &&
    pv.y == all_component_values[0].y
  ) {
    return;
  }

  if (all_component_values.length > 1) {
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    const sc = toScreenCoords(pv);
    ctx.lineTo(sc.x, sc.y);

    // Set the style
    ctx.strokeStyle = "red";
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
}

document.addEventListener("DOMContentLoaded", onLoad);
