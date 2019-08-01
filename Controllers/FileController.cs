using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace PDFTronAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileController : ControllerBase
    {
        [HttpPost("[action]")]
        public IActionResult Upload([FromBody] IFormFile file)
        {
            return Ok();
        }
    }

    public class Payload
    {
        public int File;
    }
}
