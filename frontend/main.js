const form = document.getElementById('diagnose-form');
const status = document.getElementById('status');
const output = document.getElementById('json-output');

const API_BASE = (window.API_BASE && window.API_BASE !== '') ? window.API_BASE : 'http://localhost:8000';

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = 'Uploading...';
  output.textContent = '';

  const fileInput = document.getElementById('file');
  if (!fileInput.files || fileInput.files.length === 0) {
    status.textContent = 'Select an image file first.';
    return;
  }

  const formData = new FormData();
  formData.append('crop_type', document.getElementById('crop_type').value);
  formData.append('region', document.getElementById('region').value);
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch(`${API_BASE}/diagnose`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const txt = await res.text();
      status.textContent = `Error: ${res.status}`;
      output.textContent = txt;
      return;
    }

    const data = await res.json();
    status.textContent = 'Done';

    // show pretty JSON
    output.textContent = JSON.stringify(data, null, 2);

    // optional: highlight key fields at top
    const top = [];
    if (data.diagnosis && data.diagnosis.label) top.push(`Diagnosis: ${data.diagnosis.label}`);
    if (data.confidence_overall !== undefined) top.push(`Confidence: ${Number(data.confidence_overall).toFixed(2)}`);
    if (data.treatment_plan) top.push(`Treatments: ${ (data.treatment_plan.chemical_treatments || []).length } chemical, ${ (data.treatment_plan.organic_treatments || []).length } organic`);

    if (top.length) {
      output.textContent = top.join('\n') + '\n\n' + output.textContent;
    }

  } catch (err) {
    status.textContent = 'Request failed';
    output.textContent = String(err);
  }
});
