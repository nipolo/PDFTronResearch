using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace PDFTronAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        private IHostingEnvironment hostingEnvironment;
        private string appRootFolder;

        public FileController(IHostingEnvironment env)
        {
            hostingEnvironment = env;
        }

        [HttpPost("[action]")]
        public IActionResult Upload()
        {
            using (var stream = new FileStream(Path.Combine(hostingEnvironment.WebRootPath, "test.pdf"), FileMode.Create))
            {
                Request.Body.CopyTo(stream);
            }
            return Ok();
        }
    }
}
