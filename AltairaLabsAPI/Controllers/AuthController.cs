using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AltairaLabsAPI.Services;
using AltairaLabsAPI.DTOs;

namespace AltairaLabsAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Registra un nuevo usuario
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var result = await _authService.RegisterAsync(registerDto, ipAddress);

            if (!result.Success)
                return BadRequest(result);

            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(result);
        }

        /// <summary>
        /// Inicia sesión con un usuario existente
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var result = await _authService.LoginAsync(loginDto, ipAddress);

            if (!result.Success)
                return BadRequest(result);

            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(result);
        }

        /// <summary>
        /// Refresca el token de acceso
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return BadRequest(new { message = "Token no proporcionado" });

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var result = await _authService.RefreshTokenAsync(refreshToken, ipAddress);

            if (!result.Success)
                return BadRequest(result);

            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(result);
        }

        /// <summary>
        /// Cierra la sesión del usuario
        /// </summary>
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Ok(new { message = "Sesión cerrada" });

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            await _authService.RevokeTokenAsync(refreshToken, ipAddress);
            
            Response.Cookies.Delete("refreshToken");
            return Ok(new { message = "Sesión cerrada correctamente" });
        }

        /// <summary>
        /// Establece la cookie del refresh token
        /// </summary>
        private void SetRefreshTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = System.DateTime.UtcNow.AddDays(7),
                SameSite = SameSiteMode.Strict,
                Secure = true
            };
            Response.Cookies.Append("refreshToken", token, cookieOptions);
        }
    }
}

