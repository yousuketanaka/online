 <footer>
        <div class="row">
            <div class="col-lg-12 footer-copy">
                <p>Copyright &copy; Your Website 2014</p>
            </div>
        </div>
    </footer>

    <!-- /.container -->

    <!-- jQuery -->
    <script src="<?php bloginfo('template_url' ); ?>/js/jquery.js"></script>
    <script src="<?php bloginfo('template_url' ); ?>/js/jquery-3.1.1.min.js"></script>
    <script src="<?php bloginfo('template_url' ); ?>/js/basictable/jquery.basictable.min.js"></script>
    <script>
        $(function(){
            $('#tableprice').basictable({
                breakpoint:540
            });
        });
    </script>

    <!-- Bootstrap Core JavaScript -->
    <script src="<?php bloginfo('template_url' ); ?>/js/bootstrap.min.js"></script>

    <!-- Script to Activate the Carousel -->
    <script>
    $('.carousel').carousel({
        interval: 5000 //changes the speed
    })
    </script>
    <script>
document.tidioIdentify = {
	distinct_id: '1',
	email: 'bambooshoots.vietnam@mail.com',
	first_name: 'Yousuke',
	last_name: 'Tanaka'
};
</script>
<?php wp_footer(); ?>
</body>
</div>

</html>